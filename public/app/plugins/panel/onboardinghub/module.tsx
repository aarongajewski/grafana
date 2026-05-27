import { PanelPlugin } from '@grafana/data';

import { OnboardingHubPanel } from './OnboardingHubPanel';

export const plugin = new PanelPlugin(OnboardingHubPanel).setNoPadding();
