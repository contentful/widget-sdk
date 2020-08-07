import _ from 'lodash';
import sinon from 'sinon';

function ensureLeadingSlash(x = '') {
  if (x.charAt(0) === '/') {
    return x;
  } else {
    return '/' + x;
  }
}

async function stubConfig(system) {
  const mocked = {
    authUrl: (x) => `//be.test.com${ensureLeadingSlash(x)}`,
    apiUrl: (x) => `//api.test.com${ensureLeadingSlash(x)}`,
    websiteUrl: (x) => `//www.test.com${ensureLeadingSlash(x)}`,
    accountUrl: (x) => `//be.test.com/account${ensureLeadingSlash(x)}`,
    domain: 'test.com',
    env: 'unittest',
    launchDarkly: { envId: 'launch-darkly-test-id' },
    snowplow: {},
    pusher: {},
    services: {
      filestack: {},
      google: {},
      contentful: {},
      embedly: {},
      getstream_io: {},
      sentry: {},
    },
    readInjectedConfig: () => ({ config: {} }),
  };

  await system.set('Config', mocked);
}

async function stubClientStorage(system) {
  let localStore = {};

  function mockedCreate() {
    return {
      getItem: function (key) {
        return localStore[key];
      },
      setItem: function (key, value) {
        localStore[key] = value + '';
      },
      removeItem: function (key) {
        delete localStore[key];
      },
      clear: function () {
        localStore = {};
      },
    };
  }

  const mocked = {
    _store: localStore,
    createClientStorageWrapper: mockedCreate,
  };

  await system.set('core/services/BrowserStorage/ClientStorageWrapper', mocked);
}

async function stubShareJsLibClient(system) {
  await system.set('@contentful/sharejs/lib/client', {
    Connection: sinon.stub().returns({
      socket: {},
      emit: _.noop,
      disconnect: _.noop,
    }),
  });
}

async function stubPubSubSubscriber(system) {
  await system.set('services/PubSubService', {
    createPubSubClientForSpace: sinon.stub().resolves({ on: sinon.stub(), off: sinon.stub() }),
    ENVIRONMENT_ALIAS_CHANGED_EVENT: 'ENVIRONMENT_ALIAS_CHANGED_EVENT',
  });
}

async function stubFilestack(system) {
  await system.set('services/Filestack', {
    makeDropPane: sinon.stub(),
    pick: sinon.stub(),
    pickMultiple: sinon.stub(),
    store: sinon.stub(),
  });
}

async function stubLaunchDarklyUtil(system) {
  await system.set('LaunchDarkly', {
    getVariation: sinon.stub().resolves(false),
    FLAGS: {},
  });
}

beforeEach(async function () {
  await stubClientStorage(this.system);
  await stubLaunchDarklyUtil(this.system);
  await stubShareJsLibClient(this.system);
  await stubPubSubSubscriber(this.system);
  await stubFilestack(this.system);
  await stubConfig(this.system);
});
