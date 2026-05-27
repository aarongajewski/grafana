import { getBackendSrv } from '@grafana/runtime';
import { getDatasourceSrv } from 'app/features/plugins/datasource_srv';
import { getGrafanaSearcher } from 'app/features/search/service/searcher';

import { getOnboardingProgress } from './progress';

jest.mock('@grafana/runtime', () => ({
  getBackendSrv: jest.fn(),
}));

jest.mock('app/features/plugins/datasource_srv', () => ({
  getDatasourceSrv: jest.fn(),
}));

jest.mock('app/features/search/service/searcher', () => ({
  getGrafanaSearcher: jest.fn(),
}));

const backendGet = jest.fn();
const search = jest.fn();
const getList = jest.fn();

describe('getOnboardingProgress', () => {
  beforeEach(() => {
    jest.mocked(getBackendSrv).mockReturnValue({ get: backendGet } as never);
    jest.mocked(getDatasourceSrv).mockReturnValue({ getList } as never);
    jest.mocked(getGrafanaSearcher).mockReturnValue({ search } as never);

    getList.mockReturnValue([{ meta: { builtIn: false } }]);
    search.mockResolvedValue({ totalRows: 1 });
    backendGet.mockImplementation((url: string) => {
      if (url === '/api/folders') {
        return Promise.resolve([{ uid: 'folder' }]);
      }
      if (url === '/api/org/users') {
        return Promise.resolve([{ id: 1 }, { id: 2 }]);
      }
      if (url === '/api/v1/provisioning/alert-rules') {
        return Promise.resolve([{ uid: 'rule' }]);
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it('marks every step done when runtime checks find resources', async () => {
    const progress = await getOnboardingProgress();

    expect(progress.completed).toBe(5);
    expect(progress.total).toBe(5);
    expect(progress.entries.map((entry) => entry.status)).toEqual(['done', 'done', 'done', 'done', 'done']);
  });

  it('marks pending checks when resources are not found', async () => {
    getList.mockReturnValue([{ meta: { builtIn: true } }]);
    search.mockResolvedValue({ totalRows: 0 });
    backendGet.mockImplementation((url: string) => {
      if (url === '/api/folders') {
        return Promise.resolve([]);
      }
      if (url === '/api/org/users') {
        return Promise.resolve([{ id: 1 }]);
      }
      if (url === '/api/v1/provisioning/alert-rules') {
        return Promise.resolve([]);
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const progress = await getOnboardingProgress();

    expect(progress.completed).toBe(0);
    expect(progress.entries.map((entry) => entry.status)).toEqual([
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
    ]);
  });

  it('handles partial failures and alert permission errors gracefully', async () => {
    search.mockRejectedValue(new Error('Search failed'));
    backendGet.mockImplementation((url: string) => {
      if (url === '/api/folders') {
        return Promise.resolve([{ uid: 'folder' }]);
      }
      if (url === '/api/org/users') {
        return Promise.resolve([{ id: 1 }]);
      }
      if (url === '/api/v1/provisioning/alert-rules') {
        return Promise.reject({ status: 403 });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const progress = await getOnboardingProgress();

    expect(progress.entries.find((entry) => entry.id === 'dashboard')).toMatchObject({
      status: 'error',
      error: 'Search failed',
    });
    expect(progress.entries.find((entry) => entry.id === 'alert')).toMatchObject({ status: 'unknown' });
    expect(progress.completed).toBe(2);
  });
});
