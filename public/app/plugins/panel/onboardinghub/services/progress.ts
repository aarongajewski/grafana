import { getBackendSrv } from '@grafana/runtime';
import { getDatasourceSrv } from 'app/features/plugins/datasource_srv';
import { getGrafanaSearcher } from 'app/features/search/service/searcher';

import { type ChecklistEntry, type ChecklistStepId, type OnboardingProgress } from '../types';

type CheckResult = Pick<ChecklistEntry, 'status' | 'error'>;

const actionUrls: Record<ChecklistStepId, string> = {
  datasource: '/connections/datasources/new',
  dashboard: '/dashboard/new',
  folder: '/dashboards/folder/new',
  teammate: '/org/users',
  alert: '/alerting/new',
};

const checklistStepOrder: ChecklistStepId[] = ['datasource', 'dashboard', 'folder', 'teammate', 'alert'];

export async function getOnboardingProgress(): Promise<OnboardingProgress> {
  const checks = await Promise.all(
    checklistStepOrder.map(async (id) => ({
      id,
      ...(await runCheck(id)),
      actionUrl: actionUrls[id],
    }))
  );

  return toOnboardingProgress(checks);
}

export function toOnboardingProgress(entries: ChecklistEntry[]): OnboardingProgress {
  return {
    entries,
    completed: entries.filter((entry) => entry.status === 'done').length,
    total: entries.length,
    checkedAt: Date.now(),
  };
}

async function runCheck(id: ChecklistStepId): Promise<CheckResult> {
  try {
    switch (id) {
      case 'datasource':
        return doneWhen(
          getDatasourceSrv()
            .getList({ metrics: true })
            .filter((dataSource) => dataSource.meta.builtIn !== true).length > 0
        );
      case 'dashboard': {
        const result = await getGrafanaSearcher().search({ limit: 1, kind: ['dashboard'] });
        return doneWhen(result.totalRows > 0);
      }
      case 'folder': {
        const folders = await getBackendSrv().get<unknown[]>('/api/folders', { limit: 1 });
        return doneWhen(folders.length > 0);
      }
      case 'teammate': {
        const users = await getBackendSrv().get<unknown[]>('/api/org/users', { limit: 2 });
        return doneWhen(users.length > 1);
      }
      case 'alert': {
        const rules = await getBackendSrv().get<unknown[]>('/api/v1/provisioning/alert-rules');
        return doneWhen(rules.length > 0);
      }
    }
  } catch (error) {
    if (id === 'alert' && hasStatus(error, 403, 404)) {
      return { status: 'unknown' };
    }

    return { status: 'error', error: getErrorMessage(error) };
  }
}

function doneWhen(done: boolean): CheckResult {
  return { status: done ? 'done' : 'pending' };
}

function hasStatus(error: unknown, ...statuses: number[]): boolean {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return false;
  }

  return statuses.includes(Number(error.status));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = error.data;
    if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
      return data.message;
    }
  }

  return 'Unable to check setup progress';
}
