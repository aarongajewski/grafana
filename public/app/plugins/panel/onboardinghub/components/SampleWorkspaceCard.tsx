import { css } from '@emotion/css';
import { useEffect, useState } from 'react';

import { locationUtil, store, type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Alert, Button, Icon, LinkButton, Spinner, useStyles2 } from '@grafana/ui';

import {
  getExistingSampleWorkspaceResult,
  getStoredWorkspaceResult,
  persistSampleWorkspaceResult,
  provisionSampleWorkspace,
} from '../services/sampleWorkspace';
import {
  SAMPLE_WORKSPACE_PROVISIONED_KEY,
  type SampleWorkspaceDashboardLink,
  type SampleWorkspaceResult,
} from '../types';

export function SampleWorkspaceCard() {
  const styles = useStyles2(getStyles);
  const [result, setResult] = useState<SampleWorkspaceResult | undefined>(
    store.get(SAMPLE_WORKSPACE_PROVISIONED_KEY) ? getStoredWorkspaceResult() : undefined
  );
  const [error, setError] = useState<string | undefined>();
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (result) {
      return;
    }

    getExistingSampleWorkspaceResult()
      .then((existingResult) => {
        if (existingResult) {
          persistSampleWorkspaceResult(existingResult);
          setResult(existingResult);
        }
      })
      .catch(() => {});
  }, [result]);

  const onTryIt = async () => {
    setRunning(true);
    setError(undefined);
    try {
      setResult(await provisionSampleWorkspace());
    } catch (error) {
      const existingResult = await getExistingSampleWorkspaceResult();
      if (existingResult) {
        persistSampleWorkspaceResult(existingResult);
        setResult(existingResult);
      } else {
        setError(getErrorMessage(error));
      }
    } finally {
      setRunning(false);
    }
  };

  if (result) {
    return (
      <section className={styles.card} aria-label={t('onboardinghub.sample-workspace.label', 'Sample workspace')}>
        <SuccessState links={result.links} />
      </section>
    );
  }

  return (
    <section className={styles.card} aria-label={t('onboardinghub.sample-workspace.label', 'Sample workspace')}>
      <div className={styles.header}>
        <div className={styles.iconCluster} aria-hidden="true">
          <Icon name="chart-line" />
          <Icon name="cloud" />
          <Icon name="dollar-alt" />
        </div>
        <div>
          <h3 className={styles.title}>
            <Trans i18nKey="onboardinghub.sample-workspace.title">Try a sample workspace</Trans>
          </h3>
          <p className={styles.muted}>
            <Trans i18nKey="onboardinghub.sample-workspace.description">
              Import three TestData-backed dashboards so a fresh Grafana is explorable immediately.
            </Trans>
          </p>
        </div>
      </div>

      <InitialState running={running} onTryIt={onTryIt} />

      {error && (
        <Alert
          title={t('onboardinghub.sample-workspace.error-title', 'Could not create sample workspace')}
          severity="warning"
        >
          <div className={styles.errorBody}>
            <span>{error}</span>
            <Button size="sm" variant="secondary" onClick={onTryIt} disabled={running}>
              <Trans i18nKey="onboardinghub.sample-workspace.retry">Retry</Trans>
            </Button>
          </div>
        </Alert>
      )}
    </section>
  );
}

function InitialState({ running, onTryIt }: { running: boolean; onTryIt: () => void }) {
  return (
    <Button variant="primary" onClick={onTryIt} disabled={running}>
      {running && <Spinner inline />}
      <Trans i18nKey="onboardinghub.sample-workspace.try-it">Try it</Trans>
    </Button>
  );
}

function SuccessState({ links }: { links: SampleWorkspaceDashboardLink[] }) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.successState}>
      <div className={styles.success}>
        <Icon name="check-circle" />
        <h3 className={styles.title}>
          <Trans i18nKey="onboardinghub.sample-workspace.success-title">Sample workspace ready</Trans>
        </h3>
      </div>
      <p className={styles.muted}>
        <Trans i18nKey="onboardinghub.sample-workspace.success">Sample workspace created.</Trans>
      </p>
      <div className={styles.links}>
        {links.map((link) => (
          <LinkButton key={link.uid} size="sm" variant="secondary" href={locationUtil.assureBaseUrl(link.url)}>
            {getSampleWorkspaceLinkLabel(link.title)}
          </LinkButton>
        ))}
      </div>
    </div>
  );
}

function getSampleWorkspaceLinkLabel(title: string) {
  switch (title) {
    case 'Web Traffic':
      return t('onboardinghub.sample-workspace.open-web-traffic', 'Open Web Traffic');
    case 'System Metrics':
      return t('onboardinghub.sample-workspace.open-system-metrics', 'Open System Metrics');
    case 'Business Funnel':
      return t('onboardinghub.sample-workspace.open-business-funnel', 'Open Business Funnel');
    default:
      return title;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = error.data;
    if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
      return data.message;
    }
  }

  return t('onboardinghub.sample-workspace.unknown-error', 'An unexpected error occurred.');
}

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    minHeight: '100%',
  }),
  header: css({
    display: 'flex',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  }),
  iconCluster: css({
    color: theme.colors.primary.text,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    paddingTop: theme.spacing(0.5),
  }),
  title: css({
    margin: 0,
  }),
  muted: css({
    color: theme.colors.text.secondary,
    margin: theme.spacing(0.5, 0, 0),
  }),
  success: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.colors.success.text,
  }),
  successState: css({
    display: 'grid',
    gap: theme.spacing(1),
  }),
  links: css({
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  }),
  errorBody: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  }),
});
