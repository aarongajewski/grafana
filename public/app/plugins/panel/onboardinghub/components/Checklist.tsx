import { css } from '@emotion/css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInterval } from 'react-use';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, Spinner, useStyles2 } from '@grafana/ui';

import { getOnboardingProgress } from '../services/progress';
import { type ChecklistDefinition, type ChecklistStepId, type OnboardingProgress } from '../types';

import { ChecklistItem } from './ChecklistItem';

interface Props {
  initialProgress?: OnboardingProgress;
  loadProgress?: () => Promise<OnboardingProgress>;
  refreshIntervalMs?: number | null;
  onDismiss?: () => void;
}

export function Checklist({
  initialProgress,
  loadProgress = getOnboardingProgress,
  refreshIntervalMs = 30000,
  onDismiss,
}: Props) {
  const styles = useStyles2(getStyles);
  const definitions = useMemo(() => getChecklistDefinitions(), []);
  const [progress, setProgress] = useState<OnboardingProgress | undefined>(initialProgress);
  const [loading, setLoading] = useState(!initialProgress);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProgress(await loadProgress());
    } finally {
      setLoading(false);
    }
  }, [loadProgress]);

  useEffect(() => {
    if (!initialProgress) {
      refresh();
    }
  }, [initialProgress, refresh]);

  useEffect(() => {
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refresh]);

  useInterval(refresh, refreshIntervalMs);

  if (!progress) {
    return (
      <section className={styles.card} aria-label={t('onboardinghub.checklist.loading-label', 'Onboarding progress')}>
        <div className={styles.loading}>
          <Spinner inline />
          <Trans i18nKey="onboardinghub.checklist.loading">Checking setup progress</Trans>
        </div>
      </section>
    );
  }

  const complete = progress.completed === progress.total;
  const percent = Math.round((progress.completed / progress.total) * 100);

  return (
    <section className={styles.card} aria-label={t('onboardinghub.checklist.label', 'Onboarding checklist')}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.cardTitle}>
            <Trans i18nKey="onboardinghub.checklist.title">Setup progress</Trans>
          </h3>
          <p className={styles.muted}>
            <Trans
              i18nKey="onboardinghub.checklist.completed-count"
              values={{ completed: progress.completed, total: progress.total }}
            >
              {'{{completed}}'} of {'{{total}}'} complete
            </Trans>
          </p>
        </div>
        {loading && <Spinner inline />}
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.completed}
        aria-label={t('onboardinghub.checklist.progress-aria-label', 'Onboarding progress')}
      >
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>

      {complete ? (
        <div className={styles.completeCard}>
          <h4>
            <Trans i18nKey="onboardinghub.checklist.all-set-title">You&apos;re all set</Trans>
          </h4>
          <p>
            <Trans i18nKey="onboardinghub.checklist.all-set-description">
              Your Grafana workspace has the essentials in place. You can dismiss this panel whenever you are ready.
            </Trans>
          </p>
          {onDismiss && (
            <Button variant="primary" onClick={onDismiss}>
              <Trans i18nKey="onboardinghub.checklist.dismiss-this-panel">Dismiss this panel</Trans>
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {progress.entries.map((entry) => (
            <ChecklistItem
              key={entry.id}
              entry={entry}
              definition={definitions[entry.id]}
              loading={loading}
              onRetry={refresh}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function getChecklistDefinitions(): Record<ChecklistStepId, ChecklistDefinition> {
  return {
    datasource: {
      id: 'datasource',
      icon: 'database',
      title: t('onboardinghub.checklist.datasource-title', 'Connect a data source'),
      description: t(
        'onboardinghub.checklist.datasource-description',
        'Bring metrics, logs, traces, or profiles into Grafana.'
      ),
      actionLabel: t('onboardinghub.checklist.datasource-action', 'Add data source'),
      actionUrl: '/connections/datasources/new',
    },
    dashboard: {
      id: 'dashboard',
      icon: 'apps',
      title: t('onboardinghub.checklist.dashboard-title', 'Create your first dashboard'),
      description: t(
        'onboardinghub.checklist.dashboard-description',
        'Turn your data into panels, rows, and reusable views.'
      ),
      actionLabel: t('onboardinghub.checklist.dashboard-action', 'New dashboard'),
      actionUrl: '/dashboard/new',
    },
    folder: {
      id: 'folder',
      icon: 'folder',
      title: t('onboardinghub.checklist.folder-title', 'Organize with a folder'),
      description: t('onboardinghub.checklist.folder-description', 'Group dashboards by team, service, or project.'),
      actionLabel: t('onboardinghub.checklist.folder-action', 'New folder'),
      actionUrl: '/dashboards/folder/new',
    },
    teammate: {
      id: 'teammate',
      icon: 'users-alt',
      title: t('onboardinghub.checklist.teammate-title', 'Invite a teammate'),
      description: t('onboardinghub.checklist.teammate-description', 'Share your workspace and collaborate faster.'),
      actionLabel: t('onboardinghub.checklist.teammate-action', 'Manage users'),
      actionUrl: '/org/users',
    },
    alert: {
      id: 'alert',
      icon: 'bell',
      title: t('onboardinghub.checklist.alert-title', 'Set up an alert rule'),
      description: t('onboardinghub.checklist.alert-description', 'Get notified when important signals change.'),
      actionLabel: t('onboardinghub.checklist.alert-action', 'New alert rule'),
      actionUrl: '/alerting/new',
    },
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    minHeight: '100%',
    overflow: 'visible',
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    alignItems: 'flex-start',
  }),
  cardTitle: css({
    margin: 0,
  }),
  muted: css({
    color: theme.colors.text.secondary,
    margin: theme.spacing(0.5, 0, 0),
  }),
  progressTrack: css({
    height: theme.spacing(1),
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.pill,
    overflow: 'hidden',
    margin: theme.spacing(2, 0, 1),
  }),
  progressFill: css({
    height: '100%',
    background: theme.colors.primary.main,
    [theme.transitions.handleMotion('no-preference')]: {
      transition: 'width 200ms ease',
    },
  }),
  list: css({
    padding: 0,
    margin: 0,
  }),
  loading: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    minHeight: theme.spacing(12),
  }),
  completeCard: css({
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
  }),
});
