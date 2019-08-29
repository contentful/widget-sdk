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

  await system.set('Config.es6', mocked);
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

  await system.set('TheStore/ClientStorageWrapper.es6', mocked);
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
  await system.set('services/Filestack.es6', {
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

  await system.set('utils/LaunchDarkly/index.es6', mockedUtil);

  await system.set('LaunchDarkly.es6', {
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

/**
 * @ngdoc module
 * @name contentful/mocks
 * @description
 * This module provides mocks for business domain objects.
 *
 * Mocked objects include the API clients `Space`, `ContentType`,
 * `Entry` and `Asset` classes.
 */
angular
  .module('contentful/mocks', [])
  .config([
    '$provide',
    '$controllerProvider',
    ($provide, $controllerProvider) => {
      $provide.value('$exceptionHandler', e => {
        throw e;
      });

      $provide.removeDirectives = function(...args) {
        _.flatten(args).forEach(directive => {
          const fullName = directive + 'Directive';
          $provide.factory(fullName, () => []);
        });
      };

      $provide.removeControllers = function(...args) {
        _.flatten(args).forEach(controller => {
          $controllerProvider.register(controller, angular.noop);
        });
      };

      $provide.makeStubs = function makeStubs(stubList) {
        if (!_.isArray(stubList)) stubList = _.flatten(arguments);
        const stubs = {};
        _.each(stubList, val => {
          stubs[val] = sinon.stub();
        });
        return stubs;
      };
    }
  ])
  .constant('icons', {});
