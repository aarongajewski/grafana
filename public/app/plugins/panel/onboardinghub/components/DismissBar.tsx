import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, useStyles2 } from '@grafana/ui';

interface Props {
  onDismiss: () => void;
}

export function DismissBar({ onDismiss }: Props) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div>
        <h2 className={styles.title}>
          <Trans i18nKey="onboardinghub.dismiss-bar.title">Make this workspace yours</Trans>
        </h2>
        <p className={styles.subtitle}>
          <Trans i18nKey="onboardinghub.dismiss-bar.subtitle">
            Track setup progress, create sample dashboards, and catch up on what is new in Grafana.
          </Trans>
        </p>
      </div>
      <Button
        fill="text"
        variant="secondary"
        onClick={onDismiss}
        aria-label={t('onboardinghub.dismiss-bar.dismiss-aria-label', 'Dismiss Onboarding Hub')}
      >
        <Trans i18nKey="onboardinghub.dismiss-bar.dismiss">Dismiss</Trans>
      </Button>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),

    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
    },
  }),
  title: css({
    margin: 0,
  }),
  subtitle: css({
    color: theme.colors.text.secondary,
    margin: theme.spacing(0.5, 0, 0),
  }),
});
