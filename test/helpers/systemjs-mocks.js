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
    authUrl: x => `//be.test.com${ensureLeadingSlash(x)}`,
    apiUrl: x => `//api.test.com${ensureLeadingSlash(x)}`,
    websiteUrl: x => `//www.test.com${ensureLeadingSlash(x)}`,
    accountUrl: x => `//be.test.com/account${ensureLeadingSlash(x)}`,
    domain: 'test.com',
    env: 'unittest',
    launchDarkly: { envId: 'launch-darkly-test-id' },
    snowplow: {},
    services: {
      filestack: {},
      google: {},
      contentful: {},
      embedly: {},
      getstream_io: {}
    },
    readInjectedConfig: () => ({ config: {} })
  };

  await system.set('Config', mocked);
}

async function stubClientStorage(system) {
  let localStore = {};

  const mocked = {
    _store: localStore,
    default: function() {
      return {
        getItem: function(key) {
          return localStore[key];
        },
        setItem: function(key, value) {
          localStore[key] = value + '';
        },
        removeItem: function(key) {
          delete localStore[key];
        },
        clear: function() {
          localStore = {};
        }
      };
    }
  };

  await system.set('TheStore/ClientStorageWrapper', mocked);
}

async function stubShareJsLibClient(system) {
  await system.set('@contentful/sharejs/lib/client', {
    Connection: sinon.stub().returns({
      socket: {},
      emit: _.noop,
      disconnect: _.noop
    })
  });
}

async function stubFilestack(system) {
  await system.set('services/Filestack', {
    makeDropPane: sinon.stub(),
    pick: sinon.stub(),
    pickMultiple: sinon.stub(),
    store: sinon.stub()
  });
}

async function stubLaunchDarklyUtil(system) {
  const flags = {};

  const mockedUtil = {
    init: sinon.spy(),

    getCurrentVariation(flag) {
      // We need to use `$q` because otherwise the tests do not execute
      // correctly.
      return Promise.resolve(flags[flag]);
    },

    // TODO implement when needed
    onFeatureFlag: sinon.spy(),
    onABTest: sinon.spy(),

    // This does not exist on the actual client it is there for the
    // tests to control the client behavior.
    _setFlag(flag, value) {
      flags[flag] = value;
    }
  };

  await system.set('utils/LaunchDarkly', mockedUtil);

  await system.set('LaunchDarkly', {
    getVariation: sinon.stub().resolves(false)
  });
}

beforeEach(async function() {
  await stubClientStorage(this.system);
  await stubLaunchDarklyUtil(this.system);
  await stubShareJsLibClient(this.system);
  await stubFilestack(this.system);
  await stubConfig(this.system);
});
