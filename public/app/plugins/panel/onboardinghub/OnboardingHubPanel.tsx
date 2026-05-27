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
    if (config.featureToggles.onboardingHub && dismissed) {
      removePanelAndReflow(id);
    }
  }, [dismissed, id]);

  if (!config.featureToggles.onboardingHub || dismissed) {
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

export function removePanelAndReflow(panelId: number) {
  const dashboard = getDashboardSrv().getCurrent();
  const panel = dashboard?.getPanelById(panelId);

  if (!dashboard || !panel) {
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
    height: '100%',
    overflow: 'auto',
    padding: theme.spacing(2),
  }),
  grid: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(360px, 1.4fr) minmax(260px, 0.8fr) minmax(260px, 0.8fr)',
    gap: theme.spacing(2),

    [theme.breakpoints.down('lg')]: {
      gridTemplateColumns: '1fr',
    },
  }),
  checklist: css({
    minWidth: 0,
  }),
});
