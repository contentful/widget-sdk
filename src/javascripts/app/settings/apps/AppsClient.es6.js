import createMicroBackendsClient from 'MicroBackendsClient.es6';
import { getSpaceFeature } from 'data/CMA/ProductCatalog.es6';

import {
  APP_ID as IMAGE_MANAGEMENT_APP_ID,
  APP_NAME as IMAGE_MANAGEMENT_APP_NAME
} from './image-management/Constants.es6';

const BASIC_APPS_FEATURE = 'basic_apps';
const OPTIMIZELY_APP_FEATURE = 'optimizely_app';

const KNOWN_APPS = {
  netlify: {
    title: 'Netlify',
    featureId: BASIC_APPS_FEATURE
  },
  algolia: {
    title: 'Algolia',
    featureId: BASIC_APPS_FEATURE
  },
  [IMAGE_MANAGEMENT_APP_ID]: {
    title: IMAGE_MANAGEMENT_APP_NAME,
    featureId: BASIC_APPS_FEATURE
  },
  basicApprovalWorkflow: {
    title: 'Basic approval workflow',
    featureId: BASIC_APPS_FEATURE
  },
  optimizely: {
    title: 'Optimizely',
    featureId: OPTIMIZELY_APP_FEATURE,
    priceLine: 'Early access programme only'
  }
};

export default function createAppsClient(spaceId) {
  const backend = createMicroBackendsClient({
    backendName: 'apps',
    withAuth: true,
    baseUrl: `/spaces/${spaceId}`
  });

  return {
    getAll,
    get,
    save,
    proxyGetRequest,
    remove
  };

  async function getAll() {
    const featureIds = [BASIC_APPS_FEATURE, OPTIMIZELY_APP_FEATURE];

    const [res, enabled] = await Promise.all([
      backend.call(),
      Promise.all(featureIds.map(id => getSpaceFeature(spaceId, id, true)))
    ]);

    const enabledByFeatureId = featureIds.reduce((acc, id, i) => {
      return { ...acc, [id]: enabled[i] };
    }, {});

    if (res.status > 299) {
      throw new Error('Could not fetch apps.');
    }

    const appConfigs = await res.json();

    return Object.keys(KNOWN_APPS).reduce((acc, id) => {
      const config = appConfigs[id];
      const appDescriptor = KNOWN_APPS[id];

      const app = {
        id,
        title: appDescriptor.title,
        enabled: enabledByFeatureId[appDescriptor.featureId],
        priceLine: appDescriptor.priceLine,
        installed: !!config,
        config: config || {}
      };

      return acc.concat([app]);
    }, []);
  }

  async function get(appId) {
    const apps = await getAll();
    const app = apps.find(app => app.id === appId && app.enabled);

    if (app) {
      return app;
    } else {
      throw new Error(`Could not fetch "${appId}".`);
    }
  }

  function save(appId, config) {
    return backend.call(appId, {
      method: 'PUT',
      body: JSON.stringify(config),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function proxyGetRequest(appId, url, headers) {
    return backend.call(appId + '/request', {
      method: 'POST',
      body: JSON.stringify({ method: 'GET', url, headers }),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function remove(appId) {
    return backend.call(appId, { method: 'DELETE' });
  }
}
