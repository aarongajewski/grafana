import { css } from '@emotion/css';

import { locationUtil, type GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { Badge, Button, Icon, LinkButton, useStyles2 } from '@grafana/ui';

import { type ChecklistDefinition, type ChecklistEntry } from '../types';

interface Props {
  definition: ChecklistDefinition;
  entry: ChecklistEntry;
  loading?: boolean;
  onRetry?: () => void;
}

export function ChecklistItem({ definition, entry, loading, onRetry }: Props) {
  const styles = useStyles2(getStyles);
  const done = entry.status === 'done';
  const busy = Boolean(loading) || entry.status === 'in-progress';

  return (
    <li className={styles.row} role="checkbox" aria-checked={done} aria-busy={busy}>
      <div className={styles.icon} aria-hidden="true">
        <Icon name={done ? 'check-circle' : definition.icon} />
      </div>
      <div className={styles.content}>
        <div className={styles.heading}>
          <h4 className={styles.title}>{definition.title}</h4>
          <StatusBadge status={entry.status} loading={loading} />
        </div>
        <p className={styles.description}>{entry.error ?? definition.description}</p>
      </div>
      <div className={styles.action}>
        {entry.status === 'error' ? (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            <Trans i18nKey="onboardinghub.checklist.retry">Retry</Trans>
          </Button>
        ) : (
          <LinkButton
            size="sm"
            variant={done ? 'secondary' : 'primary'}
            href={locationUtil.assureBaseUrl(definition.actionUrl)}
          >
            {definition.actionLabel}
          </LinkButton>
        )}
      </div>
    </li>
  );
}

function StatusBadge({ status, loading }: Pick<Props, 'loading'> & Pick<ChecklistEntry, 'status'>) {
  if (loading || status === 'in-progress') {
    return <Badge color="blue" text={<Trans i18nKey="onboardinghub.checklist.status-checking">Checking</Trans>} />;
  }

  if (status === 'done') {
    return (
      <Badge color="green" icon="check" text={<Trans i18nKey="onboardinghub.checklist.status-done">Done</Trans>} />
    );
  }

  if (status === 'error') {
    return <Badge color="red" text={<Trans i18nKey="onboardinghub.checklist.status-needs-retry">Needs retry</Trans>} />;
  }

  if (status === 'unknown') {
    return (
      <Badge color="orange" text={<Trans i18nKey="onboardinghub.checklist.status-unavailable">Unavailable</Trans>} />
    );
  }

  return <Badge color="darkgrey" text={<Trans i18nKey="onboardinghub.checklist.status-pending">Pending</Trans>} />;
}

const getStyles = (theme: GrafanaTheme2) => ({
  row: css({
    display: 'grid',
    gridTemplateColumns: '32px 1fr auto',
    gap: theme.spacing(1.5),
    alignItems: 'center',
    listStyle: 'none',
    padding: theme.spacing(1.25, 0),
    borderBottom: `1px solid ${theme.colors.border.weak}`,

    '&:last-child': {
      borderBottom: 0,
    },

    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '32px 1fr',
    },
  }),
  icon: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.primary.text,
  }),
  content: css({
    minWidth: 0,
  }),
  heading: css({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
    flexWrap: 'wrap',
  }),
  title: css({
    margin: 0,
  }),
  description: css({
    color: theme.colors.text.secondary,
    margin: theme.spacing(0.5, 0, 0),
  }),
  action: css({
    [theme.breakpoints.down('sm')]: {
      gridColumn: '2 / -1',
      justifySelf: 'start',
    },
  }),
});
