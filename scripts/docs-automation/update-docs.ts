/**
 * Harness + Cursor documentation automation demo.
 * Invoked from the cursor_docs_update_demo pipeline on PR events.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Agent, CursorAgentError } from '@cursor/sdk';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const DOCS_STYLE_GUIDE = resolve(REPO_ROOT, 'docs/AGENTS.md');

function run(cmd: string): string {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function parseArgs(argv: string[]): { base: string; dryRun: boolean } {
  let base = process.env.BASE_BRANCH ?? 'main';
  let dryRun = process.env.DRY_RUN === 'true';

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base' && argv[i + 1]) {
      base = argv[++i];
    }
    if (argv[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { base, dryRun };
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

function pushBranch(branch: string, token: string, remoteUrl: string): void {
  const slug = remoteUrl.replace(/^https:\/\//, '');
  const authedUrl = `https://x-access-token:${token}@${slug}`;
  run(`git push ${authedUrl} HEAD:${branch}`);
  console.log(`Pushed documentation commit to ${branch}.`);
}

async function main(): Promise<void> {
  const { base, dryRun } = parseArgs(process.argv.slice(2));
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

  const committed = commitDocsChanges();
  if (!committed) {
    process.exit(0);
  }

  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.PR_BRANCH ?? run('git rev-parse --abbrev-ref HEAD');
  const remoteUrl = process.env.GITHUB_REPO_URL ?? 'https://github.com/aarongajewski/grafana.git';

  if (!token) {
    console.error('GITHUB_TOKEN is required to push documentation commits.');
    process.exit(1);
  }

  pushBranch(branch, token, remoteUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
