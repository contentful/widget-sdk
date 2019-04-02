import createMicroBackendsClient from 'MicroBackendsClient.es6';
import {
  APP_ID as IMAGE_MANAGEMENT_APP_ID,
  APP_NAME as IMAGE_MANAGEMENT_APP_NAME
} from './image-management/Constants.es6';

const KNOWN_APPS = {
  netlify: {
    title: 'Netlify'
  },
  algolia: {
    title: 'Algolia'
  },
  [IMAGE_MANAGEMENT_APP_ID]: {
    title: IMAGE_MANAGEMENT_APP_NAME
  },
  basicApprovalWorkflow: {
    title: 'Basic approval workflow'
  },
  optimizely: {
    title: 'Optimizely',
    soon: true
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
    remove
  };

  async function getAll() {
    const res = await backend.call();
    if (res.status > 299) {
      throw new Error('Could not fetch apps.');
    }

    const appConfigs = await res.json();

    return Object.keys(KNOWN_APPS).reduce((acc, id) => {
      const config = appConfigs[id];
      const app = { ...KNOWN_APPS[id], id, installed: !!config, config: config || {} };
      return acc.concat([app]);
    }, []);
  }

  async function get(appId) {
    const apps = await getAll();
    const app = apps.find(app => app.id === appId && !app.soon);

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

  function remove(appId) {
    return backend.call(appId, { method: 'DELETE' });
  }
}
