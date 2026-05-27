import { type Meta, type StoryFn } from '@storybook/react';

import { toOnboardingProgress } from '../services/progress';
import { type ChecklistEntry } from '../types';

import { Checklist } from './Checklist';

const meta: Meta<typeof Checklist> = {
  title: 'Plugins/OnboardingHub/Checklist',
  component: Checklist,
};

export default meta;

const pendingEntries: ChecklistEntry[] = [
  { id: 'datasource', status: 'pending', actionUrl: '/connections/datasources/new' },
  { id: 'dashboard', status: 'pending', actionUrl: '/dashboard/new' },
  { id: 'folder', status: 'pending', actionUrl: '/dashboards/folder/new' },
  { id: 'teammate', status: 'pending', actionUrl: '/org/users' },
  { id: 'alert', status: 'pending', actionUrl: '/alerting/new' },
];

const Template: StoryFn<typeof Checklist> = (args) => <Checklist {...args} refreshIntervalMs={null} />;

export const AllPending = Template.bind({});
AllPending.args = {
  initialProgress: toOnboardingProgress(pendingEntries),
};

export const Mixed = Template.bind({});
Mixed.args = {
  initialProgress: toOnboardingProgress([
    { id: 'datasource', status: 'done', actionUrl: '/connections/datasources/new' },
    { id: 'dashboard', status: 'done', actionUrl: '/dashboard/new' },
    { id: 'folder', status: 'pending', actionUrl: '/dashboards/folder/new' },
    { id: 'teammate', status: 'error', actionUrl: '/org/users', error: 'Could not load users' },
    { id: 'alert', status: 'unknown', actionUrl: '/alerting/new' },
  ]),
};

export const AllDone = Template.bind({});
AllDone.args = {
  initialProgress: toOnboardingProgress(pendingEntries.map((entry) => ({ ...entry, status: 'done' }))),
};
