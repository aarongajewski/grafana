import { store } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { getDatasourceSrv } from 'app/features/plugins/datasource_srv';
import { type ImportDashboardResponseDTO } from 'app/types/dashboard';
import { type FolderDTO } from 'app/types/folders';

import businessFunnelDashboard from '../data/sample/business-funnel.json';
import systemMetricsDashboard from '../data/sample/system-metrics.json';
import webTrafficDashboard from '../data/sample/web-traffic.json';
import {
  SAMPLE_WORKSPACE_FOLDER_UID,
  SAMPLE_WORKSPACE_PROVISIONED_KEY,
  SAMPLE_WORKSPACE_STORAGE_KEY,
  TESTDATA_DATASOURCE_TYPE,
  TESTDATA_DATASOURCE_UID,
  type SampleWorkspaceResult,
  sampleWorkspaceDashboardLinks,
} from '../types';

const sampleDashboards = [webTrafficDashboard, systemMetricsDashboard, businessFunnelDashboard];

export async function provisionSampleWorkspace(): Promise<SampleWorkspaceResult> {
  if (store.get(SAMPLE_WORKSPACE_PROVISIONED_KEY)) {
    return getStoredWorkspaceResult();
  }

  await ensureTestDataDatasource();

  const folder = await ensureSampleWorkspaceFolder();
  const createdDashboardUids: string[] = [];
  const links: SampleWorkspaceResult['links'] = [];

  try {
    for (const dashboard of sampleDashboards) {
      const response = await getBackendSrv().post<ImportDashboardResponseDTO>('/api/dashboards/import', {
        dashboard,
        overwrite: false,
        inputs: [],
        folderUid: folder.uid,
      });

      createdDashboardUids.push(response.uid);
      links.push({
        uid: response.uid,
        title: response.title,
        url: response.importedUrl,
      });
    }
  } catch (error) {
    await rollbackCreatedDashboards(createdDashboardUids);
    throw error;
  }

  const result: SampleWorkspaceResult = {
    folderUid: folder.uid,
    dashboardUids: links.map((link) => link.uid),
    links,
  };

  store.set(SAMPLE_WORKSPACE_PROVISIONED_KEY, true);
  store.set(SAMPLE_WORKSPACE_STORAGE_KEY, JSON.stringify(result));

  return result;
}

export function getStoredWorkspaceResult(): SampleWorkspaceResult {
  const storedValue = store.get(SAMPLE_WORKSPACE_STORAGE_KEY);
  if (typeof storedValue === 'string') {
    try {
      const parsed = JSON.parse(storedValue);
      if (isSampleWorkspaceResult(parsed)) {
        return parsed;
      }
    } catch {
      // Fall through to stable defaults.
    }
  }

  return {
    folderUid: SAMPLE_WORKSPACE_FOLDER_UID,
    dashboardUids: sampleWorkspaceDashboardLinks.map((link) => link.uid),
    links: sampleWorkspaceDashboardLinks,
  };
}

function isSampleWorkspaceResult(value: unknown): value is SampleWorkspaceResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return 'folderUid' in value && 'dashboardUids' in value && 'links' in value;
}

async function ensureTestDataDatasource(): Promise<void> {
  const existing = getDatasourceSrv()
    .getList({ metrics: true, pluginId: TESTDATA_DATASOURCE_TYPE })
    .find((dataSource) => dataSource.uid === TESTDATA_DATASOURCE_UID);

  if (existing) {
    return;
  }

  await getBackendSrv().post('/api/datasources', {
    name: 'Onboarding TestData',
    type: TESTDATA_DATASOURCE_TYPE,
    uid: TESTDATA_DATASOURCE_UID,
    access: 'proxy',
    isDefault: false,
    jsonData: {},
  });

  getDatasourceSrv().reload();
}

async function ensureSampleWorkspaceFolder(): Promise<FolderDTO> {
  try {
    return await getBackendSrv().get<FolderDTO>(`/api/folders/${SAMPLE_WORKSPACE_FOLDER_UID}`);
  } catch (error) {
    if (!hasStatus(error, 404)) {
      throw error;
    }
  }

  return await getBackendSrv().post<FolderDTO>('/api/folders', {
    uid: SAMPLE_WORKSPACE_FOLDER_UID,
    title: 'Sample workspace',
  });
}

async function rollbackCreatedDashboards(dashboardUids: string[]): Promise<void> {
  for (const uid of [...dashboardUids].reverse()) {
    try {
      await getBackendSrv().delete(`/api/dashboards/uid/${uid}`, undefined, {
        showSuccessAlert: false,
        validatePath: true,
      });
    } catch {
      // Best-effort rollback. Surface the original import error to the caller.
    }
  }
}

function hasStatus(error: unknown, status: number): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && Number(error.status) === status;
}
