import { store } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { getDatasourceSrv } from 'app/features/plugins/datasource_srv';

import {
  SAMPLE_WORKSPACE_FOLDER_UID,
  SAMPLE_WORKSPACE_PROVISIONED_KEY,
  SAMPLE_WORKSPACE_STORAGE_KEY,
  TESTDATA_DATASOURCE_UID,
} from '../types';

import { provisionSampleWorkspace } from './sampleWorkspace';

jest.mock('@grafana/runtime', () => ({
  getBackendSrv: jest.fn(),
}));

jest.mock('app/features/plugins/datasource_srv', () => ({
  getDatasourceSrv: jest.fn(),
}));

const backendGet = jest.fn();
const backendPost = jest.fn();
const backendDelete = jest.fn();
const getList = jest.fn();
const reload = jest.fn();

interface BackendPostBody {
  uid?: string;
  title?: string;
  dashboard?: {
    uid: string;
    title: string;
  };
}

describe('provisionSampleWorkspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.delete(SAMPLE_WORKSPACE_PROVISIONED_KEY);
    store.delete(SAMPLE_WORKSPACE_STORAGE_KEY);
    jest.mocked(getBackendSrv).mockReturnValue({ get: backendGet, post: backendPost, delete: backendDelete } as never);
    jest.mocked(getDatasourceSrv).mockReturnValue({ getList, reload } as never);

    getList.mockReturnValue([]);
    backendGet.mockRejectedValue({ status: 404 });
    backendPost.mockImplementation((url: string, body: BackendPostBody) => {
      if (url === '/api/datasources') {
        return Promise.resolve({ uid: body.uid });
      }
      if (url === '/api/folders') {
        return Promise.resolve({ uid: body.uid, title: body.title });
      }
      if (url === '/api/dashboards/import') {
        const dashboard = getDashboard(body);
        return Promise.resolve({
          uid: dashboard.uid,
          title: dashboard.title,
          importedUrl: `/d/${dashboard.uid}`,
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    backendDelete.mockResolvedValue({});
  });

  it('creates a TestData datasource, folder, and imports three dashboards', async () => {
    const result = await provisionSampleWorkspace();

    expect(backendPost).toHaveBeenCalledWith(
      '/api/datasources',
      expect.objectContaining({ uid: TESTDATA_DATASOURCE_UID, type: 'grafana-testdata-datasource' })
    );
    expect(reload).toHaveBeenCalled();
    expect(backendPost).toHaveBeenCalledWith(
      '/api/folders',
      expect.objectContaining({ uid: SAMPLE_WORKSPACE_FOLDER_UID, title: 'Sample workspace' })
    );
    expect(backendPost.mock.calls.filter(([url]) => url === '/api/dashboards/import')).toHaveLength(3);
    expect(result.dashboardUids).toEqual(['onb-web-traffic', 'onb-system-metrics', 'onb-business-funnel']);
    expect(store.get(SAMPLE_WORKSPACE_PROVISIONED_KEY)).toBe('true');
    expect(backendDelete).not.toHaveBeenCalled();
  });

  it('returns stored result without backend calls when marker is already set', async () => {
    store.set(SAMPLE_WORKSPACE_PROVISIONED_KEY, true);
    store.set(
      SAMPLE_WORKSPACE_STORAGE_KEY,
      JSON.stringify({ folderUid: 'stored-folder', dashboardUids: ['stored'], links: [] })
    );

    const result = await provisionSampleWorkspace();

    expect(result.folderUid).toBe('stored-folder');
    expect(backendPost).not.toHaveBeenCalled();
    expect(backendGet).not.toHaveBeenCalled();
  });

  it('rolls back dashboards created during a failed import run', async () => {
    backendPost.mockImplementation((url: string, body: BackendPostBody) => {
      if (url === '/api/datasources') {
        return Promise.resolve({ uid: body.uid });
      }
      if (url === '/api/folders') {
        return Promise.resolve({ uid: body.uid, title: body.title });
      }
      if (url === '/api/dashboards/import' && getDashboard(body).uid === 'onb-web-traffic') {
        const dashboard = getDashboard(body);
        return Promise.resolve({
          uid: dashboard.uid,
          title: dashboard.title,
          importedUrl: '/d/onb-web-traffic',
        });
      }
      if (url === '/api/dashboards/import') {
        return Promise.reject(new Error('Import failed'));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await expect(provisionSampleWorkspace()).rejects.toThrow('Import failed');

    expect(backendDelete).toHaveBeenCalledWith('/api/dashboards/uid/onb-web-traffic', undefined, {
      showSuccessAlert: false,
      validatePath: true,
    });
    expect(store.get(SAMPLE_WORKSPACE_PROVISIONED_KEY)).toBeUndefined();
  });
});

function getDashboard(body: BackendPostBody) {
  if (!body.dashboard) {
    throw new Error('Expected dashboard import body');
  }

  return body.dashboard;
}
