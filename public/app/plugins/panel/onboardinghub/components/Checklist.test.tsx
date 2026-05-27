import { render, screen, waitFor } from 'test/test-utils';

import { toOnboardingProgress } from '../services/progress';
import { type ChecklistEntry } from '../types';

import { Checklist } from './Checklist';

const baseEntries: ChecklistEntry[] = [
  { id: 'datasource', status: 'done', actionUrl: '/connections/datasources/new' },
  { id: 'dashboard', status: 'done', actionUrl: '/dashboard/new' },
  { id: 'folder', status: 'pending', actionUrl: '/dashboards/folder/new' },
  { id: 'teammate', status: 'pending', actionUrl: '/org/users' },
  { id: 'alert', status: 'pending', actionUrl: '/alerting/new' },
];

describe('Checklist', () => {
  it('shows completed setup progress', () => {
    render(<Checklist initialProgress={toOnboardingProgress(baseEntries)} refreshIntervalMs={null} />);

    const progressbar = screen.getByRole('progressbar', { name: /onboarding progress/i });
    expect(progressbar).toHaveAttribute('aria-valuenow', '2');
    expect(progressbar).toHaveAttribute('aria-valuemax', '5');
    expect(screen.getByText('2 of 5 complete')).toBeInTheDocument();
  });

  it('renders failed checks with retry', async () => {
    const loadProgress = jest.fn().mockResolvedValue(toOnboardingProgress(baseEntries));
    const { user } = render(
      <Checklist
        initialProgress={toOnboardingProgress([
          { id: 'datasource', status: 'error', actionUrl: '/connections/datasources/new', error: 'Network error' },
          ...baseEntries.slice(1),
        ])}
        loadProgress={loadProgress}
        refreshIntervalMs={null}
      />
    );

    expect(screen.getByText('Network error')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => expect(loadProgress).toHaveBeenCalledTimes(1));
  });

  it('renders all-done state and dismiss button', () => {
    const onDismiss = jest.fn();
    render(
      <Checklist
        initialProgress={toOnboardingProgress(baseEntries.map((entry) => ({ ...entry, status: 'done' })))}
        refreshIntervalMs={null}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByRole('heading', { name: /you're all set/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss this panel/i })).toBeInTheDocument();
  });

  it('exposes checklist state with aria attributes', () => {
    render(<Checklist initialProgress={toOnboardingProgress(baseEntries)} refreshIntervalMs={null} />);

    expect(screen.getByRole('checkbox', { name: /connect a data source/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: /organize with a folder/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('checkbox', { name: /connect a data source/i })).toHaveAttribute('aria-busy', 'false');
  });
});
