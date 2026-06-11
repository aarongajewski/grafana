/**
 * Harness + Cursor documentation automation demo.
 * Invoked from the cursor_docs_update_demo pipeline on PR events.
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { Agent, CursorAgentError } from '@cursor/sdk';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const DOCS_STYLE_GUIDE = resolve(REPO_ROOT, 'docs/AGENTS.md');

function run(cmd: string): string {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function parseArgs(argv: string[]): { base: string; dryRun: boolean; prNumber?: string } {
  let base = process.env.BASE_BRANCH ?? 'main';
  let dryRun = process.env.DRY_RUN === 'true';
  let prNumber = process.env.PR_NUMBER;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base' && argv[i + 1]) {
      base = argv[++i];
    }
    if (argv[i] === '--pr-number' && argv[i + 1]) {
      prNumber = argv[++i];
    }
    if (argv[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { base, dryRun, prNumber };
}

function collectDiffSummary(base: string): string {
  run(`git fetch origin ${base} --depth=1 2>/dev/null || true`);
  const changedFiles = run(`git diff --name-only origin/${base}...HEAD 2>/dev/null || git diff --name-only ${base}...HEAD`);
  const diffStat = run(`git diff --stat origin/${base}...HEAD 2>/dev/null || git diff --stat ${base}...HEAD`);
  const commitMessages = run('git log --oneline -5');

  return [
    '## Changed files',
    changedFiles || '(none)',
    '',
    '## Diff stat',
    diffStat || '(none)',
    '',
    '## Recent commits',
    commitMessages,
  ].join('\n');
}

function buildPrompt(base: string, diffSummary: string): string {
  const styleGuide = existsSync(DOCS_STYLE_GUIDE)
    ? readFileSync(DOCS_STYLE_GUIDE, 'utf8')
    : 'Follow standard technical writing practices.';

  return [
    'You are updating Grafana documentation for an open pull request.',
    'Read the code diff context below and add or update docs under docs/sources/ so the PR includes matching documentation.',
    'Follow the documentation style guide exactly.',
    '',
    'Rules:',
    '- Only edit files under docs/sources/ unless a shared doc under docs/ clearly applies.',
    '- Do not change application code, tests, or CI config.',
    '- Keep edits minimal and focused on what this PR introduces.',
    '- If HarnessDocsDemoMarker or harness_docs_demo.go changed, add a short developer note under docs/sources/developer-resources/.',
    '- Use sentence case headings and include front matter where other pages in the same folder use it.',
    '- If documentation is already complete for this change, make no edits.',
    '',
    `Base branch: ${base}`,
    '',
    '## Documentation style guide (docs/AGENTS.md)',
    styleGuide,
    '',
    '## Pull request diff context',
    diffSummary,
  ].join('\n');
}

function hasDocsChanges(): boolean {
  const status = run('git status --porcelain docs/');
  return status.length > 0;
}

function commitDocsChanges(): boolean {
  if (!hasDocsChanges()) {
    console.log('No documentation changes to commit.');
    return false;
  }

  run('git add docs/');
  run('git commit -m "docs: auto-update documentation via Cursor Harness pipeline"');
  console.log('Committed documentation updates.');
  return true;
}

function pushWithConnectorNetrc(branch: string): boolean {
  const { DRONE_NETRC_MACHINE, DRONE_NETRC_USERNAME, DRONE_NETRC_PASSWORD, HOME } = process.env;
  if (!DRONE_NETRC_MACHINE || !DRONE_NETRC_USERNAME || !DRONE_NETRC_PASSWORD) {
    return false;
  }

  const homeDir = HOME ?? tmpdir();
  const netrcPath = join(homeDir, '.netrc');
  writeFileSync(
    netrcPath,
    `machine ${DRONE_NETRC_MACHINE}\nlogin ${DRONE_NETRC_USERNAME}\npassword ${DRONE_NETRC_PASSWORD}\n`,
    { mode: 0o600 }
  );

  try {
    execFileSync('git', ['push', 'origin', `HEAD:${branch}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        HOME: homeDir,
        GIT_TERMINAL_PROMPT: '0',
      },
    });
    console.log(`Pushed documentation commit to ${branch} via Harness connector credentials.`);
    return true;
  } catch {
    return false;
  }
}

function pushWithAskpass(branch: string, token: string, remoteUrl: string): void {
  // Use GIT_ASKPASS so the token never appears in the remote URL or logged argv.
  const askpassPath = join(tmpdir(), `git-askpass-${process.pid}.sh`);
  writeFileSync(
    askpassPath,
    '#!/bin/sh\ncase "$1" in\n*Username*) echo "x-access-token";;\n*Password*) echo "$GIT_PUSH_TOKEN";;\nesac\n',
    { mode: 0o700 }
  );

  try {
    // An empty credential.helper resets configured helpers, forcing Git to use our askpass token.
    execFileSync('git', ['-c', 'credential.helper=', 'push', remoteUrl, `HEAD:${branch}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GIT_PUSH_TOKEN: token,
        GIT_ASKPASS: askpassPath,
        GIT_TERMINAL_PROMPT: '0',
        DISPLAY: '1',
      },
    });
    console.log(`Pushed documentation commit to ${branch}.`);
  } finally {
    try {
      unlinkSync(askpassPath);
    } catch {
      // Best-effort cleanup of the temporary askpass helper.
    }
  }
}

function pushBranch(branch: string, token: string, remoteUrl: string): void {
  if (pushWithConnectorNetrc(branch)) {
    return;
  }

  try {
    pushWithAskpass(branch, token, remoteUrl);
  } catch (err) {
    console.error(
      'Git push failed. Ensure Harness secret github_pat is a classic PAT with repo scope ' +
        'or a fine-grained PAT with Contents: Read and write on aarongajewski/grafana.'
    );
    throw err;
  }
}

async function postPrComment(token: string, prNumber: string, body: string): Promise<void> {
  const repoSlug =
    process.env.GITHUB_REPO_URL?.replace(/\.git$/, '').replace('https://github.com/', '') ??
    'aarongajewski/grafana';

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const issuesResponse = await fetch(`https://api.github.com/repos/${repoSlug}/issues/${prNumber}/comments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body }),
  });

  if (issuesResponse.ok) {
    console.log(`Posted comment on PR #${prNumber}.`);
    return;
  }

  // Fine-grained PATs often grant Pull requests but not Issues; review comments work there.
  const reviewResponse = await fetch(`https://api.github.com/repos/${repoSlug}/pulls/${prNumber}/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body, event: 'COMMENT' }),
  });

  if (reviewResponse.ok) {
    console.log(`Posted PR review comment on PR #${prNumber}.`);
    return;
  }

  const details = await reviewResponse.text();
  console.warn(
    `PR comment failed (issues: ${issuesResponse.status}, reviews: ${reviewResponse.status}). ` +
      'Grant Issues: Read and write or Pull requests: Read and write on the PAT. ' +
      details
  );
}

async function main(): Promise<void> {
  const { base, dryRun, prNumber } = parseArgs(process.argv.slice(2));
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    console.error('CURSOR_API_KEY is required.');
    process.exit(1);
  }

  const diffSummary = collectDiffSummary(base);
  const prompt = buildPrompt(base, diffSummary);

  console.log('Invoking Cursor agent to update documentation...');

  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: 'composer-2.5' },
      local: { cwd: REPO_ROOT, settingSources: [] },
    });

    if (result.status === 'error') {
      console.error(`Cursor agent run failed: ${result.id}`);
      process.exit(2);
    }

    console.log('Cursor agent finished:', result.status);
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(`Cursor agent startup failed: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  if (dryRun) {
    console.log('Dry run enabled; skipping commit and push.');
    process.exit(0);
  }

  const token = process.env.GITHUB_TOKEN;
  const commentBody =
    'Documentation auto-update pipeline finished. Review the docs commit on this PR.';
  const committed = commitDocsChanges();

  if (!committed) {
    if (token && prNumber) {
      await postPrComment(
        token,
        prNumber,
        'Documentation auto-update pipeline finished. No additional documentation changes were needed.'
      );
    }
    process.exit(0);
  }

  const branch = process.env.PR_BRANCH ?? run('git rev-parse --abbrev-ref HEAD');
  const remoteUrl = process.env.GITHUB_REPO_URL ?? 'https://github.com/aarongajewski/grafana.git';

  if (!token) {
    console.error('GITHUB_TOKEN is required to push documentation commits.');
    process.exit(1);
  }

  pushBranch(branch, token, remoteUrl);

  if (prNumber) {
    await postPrComment(token, prNumber, commentBody);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
