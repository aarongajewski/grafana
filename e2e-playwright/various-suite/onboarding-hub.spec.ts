import { expect, test } from '@grafana/plugin-e2e';

const sampleDashboardUids = ['onb-web-traffic', 'onb-system-metrics', 'onb-business-funnel'];
const sampleDatasourceUid = 'onb-testdata';
const sampleFolderUid = 'onb-sample-workspace';
const e2eHomeDashboardUid = 'onb-e2e-home';

test.use({
  featureToggles: {
    onboardingHub: true,
    dashboardNewLayouts: false,
  },
});

test.describe(
  'Onboarding Hub',
  {
    tag: ['@various'],
  },
  () => {
    test.beforeEach(async ({ request }) => {
      await request.patch('/api/user/preferences', { data: { homeDashboardUID: '' } });
      await request.delete(`/api/dashboards/uid/${e2eHomeDashboardUid}`);
      for (const uid of sampleDashboardUids) {
        await request.delete(`/api/dashboards/uid/${uid}`);
      }
      await request.delete(`/api/folders/${sampleFolderUid}`, { params: { forceDeleteRules: true } });
      await request.delete(`/api/datasources/uid/${sampleDatasourceUid}`);

      await request.post('/api/dashboards/db', {
        data: {
          dashboard: createE2EHomeDashboard(),
          overwrite: true,
          folderUid: '',
        },
      });
      await request.patch('/api/user/preferences', { data: { homeDashboardUID: e2eHomeDashboardUid } });
    });

    test.afterEach(async ({ request }) => {
      await request.patch('/api/user/preferences', { data: { homeDashboardUID: '' } });
      await request.delete(`/api/dashboards/uid/${e2eHomeDashboardUid}`);
    });

    test('renders, provisions samples, persists, dismisses, and resets', async ({ page, request }) => {
      await page.addInitScript(`Object.defineProperty(window, 'grafanaBootData', {
        configurable: true,
        set(value) {
          value.settings.featureToggles = { ...value.settings.featureToggles, onboardingHub: true };
          Object.defineProperty(window, 'grafanaBootData', {
            configurable: true,
            writable: true,
            value,
          });
        },
        get() {
          return undefined;
        },
      });`);
      await page.goto('/');
      await page.evaluate(() => {
        window.localStorage.removeItem('onboarding.hub.dismissed');
        window.localStorage.removeItem('onboarding.sample.provisioned');
        window.localStorage.removeItem('onboarding.sample.workspace');
        window.localStorage.setItem('onboarding.hub.forceEnabled', 'true');
      });
      await page.reload();

      expect(await page.evaluate(() => window.localStorage.getItem('onboarding.hub.forceEnabled'))).toBe('true');

      const hubTitle = page.getByRole('heading', { name: 'Make this workspace yours' });
      const welcomeTitle = page.getByRole('heading', { name: /welcome to grafana/i }).first();
      await expect(hubTitle).toBeVisible();
      await expect(welcomeTitle).toBeVisible();

      const hubBox = await hubTitle.boundingBox();
      const welcomeBox = await welcomeTitle.boundingBox();
      expect(hubBox?.y ?? 0).toBeLessThan(welcomeBox?.y ?? Number.POSITIVE_INFINITY);

      await page.getByRole('button', { name: 'Try it' }).click();

      await expect(page.getByRole('link', { name: 'Open Web Traffic' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Open System Metrics' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Open Business Funnel' })).toBeVisible();

      const folderResponse = await request.get(`/api/folders/${sampleFolderUid}`);
      expect(folderResponse.ok()).toBeTruthy();
      const searchResponse = await request.get('/api/search', {
        params: { folderUIDs: sampleFolderUid, type: 'dash-db' },
      });
      const searchResults = (await searchResponse.json()) as Array<{ title: string }>;
      expect(searchResults.map((result) => result.title).sort()).toEqual([
        'Business Funnel',
        'System Metrics',
        'Web Traffic',
      ]);

      await page.getByRole('link', { name: 'Open Web Traffic' }).click();
      await expect(page).toHaveURL(/onb-web-traffic/);
      await expect(page.getByText('Requests per second')).toBeVisible();
      await expect(page.getByText(/data source.*not found|panel plugin not found|plugin unavailable/i)).toBeHidden();

      await page.goto('/');
      await expect(page.getByText('Sample workspace created.')).toBeVisible();

      await page.getByRole('button', { name: 'Dismiss' }).click();
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Make this workspace yours' })).toBeHidden();

      await page.getByTestId('panel-menu-button').first().click({ force: true });
      await page.getByRole('menuitem', { name: 'More...' }).click();
      await page.getByRole('menuitem', { name: 'Reset onboarding hub' }).click();
      await expect(page.getByRole('heading', { name: 'Make this workspace yours' })).toBeVisible();
    });
  }
);

function createE2EHomeDashboard() {
  return {
    uid: e2eHomeDashboardUid,
    title: 'Home',
    schemaVersion: 41,
    time: { from: 'now-6h', to: 'now' },
    panels: [
      {
        datasource: null,
        gridPos: { h: 10, w: 24, x: 0, y: 0 },
        id: 2,
        title: '',
        transparent: true,
        type: 'onboardinghub',
      },
      {
        datasource: null,
        gridPos: { h: 3, w: 24, x: 0, y: 10 },
        id: 1,
        title: '',
        transparent: false,
        type: 'welcome',
      },
      {
        datasource: null,
        folderId: 0,
        gridPos: { h: 15, w: 12, x: 0, y: 14 },
        id: 3,
        options: {
          showStarred: true,
          showRecentlyViewed: true,
          showSearch: false,
          showHeadings: true,
          folderId: 0,
          maxItems: 30,
          tags: [],
          query: '',
        },
        title: 'Dashboards',
        type: 'dashlist',
      },
      {
        datasource: null,
        gridPos: { h: 15, w: 12, x: 12, y: 14 },
        id: 4,
        options: { feedUrl: 'https://grafana.com/blog/news.xml' },
        title: 'Latest from the blog',
        type: 'news',
      },
    ],
  };
}
