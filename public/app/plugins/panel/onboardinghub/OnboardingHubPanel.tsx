import { css } from '@emotion/css';
import { useEffect, useState } from 'react';

import { type GrafanaTheme2, type PanelProps, store } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';

import { Checklist } from './components/Checklist';
import { DismissBar } from './components/DismissBar';
import { SampleWorkspaceCard } from './components/SampleWorkspaceCard';
import { WhatsNewCard } from './components/WhatsNewCard';
import { ONBOARDING_HUB_DISMISSED_KEY } from './types';

export function OnboardingHubPanel({ id }: PanelProps) {
  const styles = useStyles2(getStyles);
  const [dismissed, setDismissed] = useState(() => store.getBool(ONBOARDING_HUB_DISMISSED_KEY, false));

  useEffect(() => {
    if (isOnboardingHubEnabled() && dismissed) {
      removePanelAndReflow(id);
    }
  }, [dismissed, id]);

  if (!isOnboardingHubEnabled() || dismissed) {
    return null;
  }

  const onDismiss = () => {
    store.set(ONBOARDING_HUB_DISMISSED_KEY, true);
    setDismissed(true);
    removePanelAndReflow(id);
  };

  return (
    <div className={styles.container}>
      <DismissBar onDismiss={onDismiss} />
      <div className={styles.grid}>
        <div className={styles.checklist}>
          <Checklist onDismiss={onDismiss} />
        </div>
        <SampleWorkspaceCard />
        <WhatsNewCard />
      </div>
    </div>
  );
}

function isOnboardingHubEnabled() {
  if (config.buildInfo.env === 'development' && store.getBool('onboarding.hub.forceEnabled', false)) {
    return true;
  }

  return (
    hasOnboardingHubToggle(config.featureToggles) ||
    hasOnboardingHubToggle(window.grafanaBootData?.settings?.featureToggles ?? {})
  );
}

function hasOnboardingHubToggle(featureToggles: object) {
  return 'onboardingHub' in featureToggles && featureToggles.onboardingHub === true;
}

export function removePanelAndReflow(panelId: number) {
  const dashboard = getDashboardSrv().getCurrent();
  const panel = dashboard?.getPanelById(panelId);

  if (!dashboard || !panel?.gridPos) {
    return;
  }

  const removedY = panel.gridPos.y;
  const removedHeight = panel.gridPos.h;

  dashboard.panels.forEach((otherPanel) => {
    if (otherPanel !== panel && otherPanel.gridPos.y > removedY) {
      otherPanel.gridPos.y = Math.max(0, otherPanel.gridPos.y - removedHeight);
    }
  });

  dashboard.removePanel(panel);
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    padding: theme.spacing(2),
    minHeight: '100%',
  }),
  grid: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(360px, 1.2fr) repeat(2, minmax(280px, 1fr))',
    alignItems: 'stretch',
    gap: theme.spacing(2),

    [theme.breakpoints.down('xl')]: {
      gridTemplateColumns: 'minmax(360px, 1.2fr) minmax(280px, 1fr)',
    },

    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: '1fr',
    },
  }),
  checklist: css({
    minWidth: 0,
    [theme.breakpoints.down('xl')]: {
      gridColumn: '1 / -1',
    },

    [theme.breakpoints.down('md')]: {
      gridColumn: 'auto',
    },
  }),
});
