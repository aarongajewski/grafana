import { render, screen } from 'test/test-utils';

import { store } from '@grafana/data';
import { config } from '@grafana/runtime';

import { getPanelProps } from '../test-utils';

import { OnboardingHubPanel } from './OnboardingHubPanel';
import { ONBOARDING_HUB_DISMISSED_KEY } from './types';

const getCurrent = jest.fn();

jest.mock('app/features/dashboard/services/DashboardSrv', () => ({
  getDashboardSrv: () => ({ getCurrent }),
}));

jest.mock('./components/Checklist', () => ({
  Checklist: () => <div>Checklist section</div>,
}));

jest.mock('./components/SampleWorkspaceCard', () => ({
  SampleWorkspaceCard: () => <div>Sample workspace section</div>,
}));

jest.mock('./components/WhatsNewCard', () => ({
  WhatsNewCard: () => <div>What&apos;s new section</div>,
}));

describe('OnboardingHubPanel', () => {
  beforeEach(() => {
    store.delete(ONBOARDING_HUB_DISMISSED_KEY);
    Object.assign(config.featureToggles, { onboardingHub: true });
    getCurrent.mockReset();
  });

  it('renders nothing when the feature toggle is off', () => {
    Object.assign(config.featureToggles, { onboardingHub: false });

    const { container } = render(<OnboardingHubPanel {...getPanelProps({})} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when dismissed and removes itself from the dashboard', () => {
    store.set(ONBOARDING_HUB_DISMISSED_KEY, true);
    const panel = { gridPos: { y: 0, h: 6 } };
    const lowerPanel = { gridPos: { y: 6, h: 3 } };
    const dashboard = {
      panels: [panel, lowerPanel],
      getPanelById: jest.fn().mockReturnValue(panel),
      removePanel: jest.fn(),
    };
    getCurrent.mockReturnValue(dashboard);

    const { container } = render(<OnboardingHubPanel {...getPanelProps({}, { id: 2 })} />);

    expect(container).toBeEmptyDOMElement();
    expect(dashboard.removePanel).toHaveBeenCalledWith(panel);
    expect(lowerPanel.gridPos.y).toBe(0);
  });

  it('renders all hub sections when enabled and not dismissed', () => {
    render(<OnboardingHubPanel {...getPanelProps({})} />);

    expect(screen.getByRole('heading', { name: /make this workspace yours/i })).toBeInTheDocument();
    expect(screen.getByText('Checklist section')).toBeInTheDocument();
    expect(screen.getByText('Sample workspace section')).toBeInTheDocument();
    expect(screen.getByText("What's new section")).toBeInTheDocument();
  });
});
