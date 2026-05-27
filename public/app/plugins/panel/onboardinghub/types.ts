import { type IconName } from '@grafana/ui';

export const ONBOARDING_HUB_DISMISSED_KEY = 'onboarding.hub.dismissed';
export const SAMPLE_WORKSPACE_PROVISIONED_KEY = 'onboarding.sample.provisioned';
export const SAMPLE_WORKSPACE_STORAGE_KEY = 'onboarding.sample.workspace';

export const SAMPLE_WORKSPACE_FOLDER_UID = 'onb-sample-workspace';
export const TESTDATA_DATASOURCE_UID = 'onb-testdata';
export const TESTDATA_DATASOURCE_TYPE = 'grafana-testdata-datasource';

export type ChecklistStepId = 'datasource' | 'dashboard' | 'folder' | 'teammate' | 'alert';

export type ChecklistStatus = 'pending' | 'in-progress' | 'done' | 'unknown' | 'error';

export interface ChecklistEntry {
  id: ChecklistStepId;
  status: ChecklistStatus;
  actionUrl: string;
  error?: string;
}

export interface ChecklistDefinition {
  id: ChecklistStepId;
  icon: IconName;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
}

export interface OnboardingProgress {
  entries: ChecklistEntry[];
  completed: number;
  total: number;
  checkedAt: number;
}

export interface WhatsNewEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  href: string;
}

export interface SampleWorkspaceDashboardLink {
  uid: string;
  title: string;
  url: string;
}

export interface SampleWorkspaceResult {
  folderUid: string;
  dashboardUids: string[];
  links: SampleWorkspaceDashboardLink[];
}

export const sampleWorkspaceDashboardLinks: SampleWorkspaceDashboardLink[] = [
  { uid: 'onb-web-traffic', title: 'Web Traffic', url: '/d/onb-web-traffic/web-traffic' },
  { uid: 'onb-system-metrics', title: 'System Metrics', url: '/d/onb-system-metrics/system-metrics' },
  { uid: 'onb-business-funnel', title: 'Business Funnel', url: '/d/onb-business-funnel/business-funnel' },
];
