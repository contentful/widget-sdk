/* global SystemJS window */
/**
 * This module sets up the SystemTest.register() where modules defined in the
 * `test/` folder register their presence.
 *
 * It also patches the Karma.start() function to load all test modules.
 */
(() => {
  // Will hold a list of all module IDs that define test cases
  const testModules = [];

  const registerInSystemJS = window.SystemJS.register.bind(window.SystemJS);

  window.SystemJS.register = register;
  window.SystemJS.testRegistry = [];

  window.libs.forEach(([name, dep]) => registerLibrary(name, dep));

  /**
   * We hook into karma start to make sure that we load all test modules before
   * we run the suites.
   */
  const Karma = window.__karma__;
  const start = Karma.start.bind(Karma);

  Error.stackTraceLimit = 1000;

  /**
   * Subscribe to promise rejection and expose error details to karma runner.
   * Note that it will fail with generic error rather than a failed test case
   * due to asynchronous event handling.
   */
  window.addEventListener('unhandledrejection', ev => {
    // Without this check there will be an error in async tests using `Promise.reject()`
    if (ev.reason) {
      window.__karma__.error(`Unhandled rejection: ${ev.reason.stack}`);
    }
  });

  Karma.start = async (...args) => {
    try {
      // This needs to be registered early because prelude depends on it (and it not being in `this.system`);
      SystemJS.register('Config.es6', [], _export => {
        _export({
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
        });

        return {
          setters: [],
          execute: function() {}
        };
      });

      // TODO: figure out how to get Chrome to not fail when loading so many files...
      // below does NOT work
      // await new Promise(resolve => setTimeout(resolve, 10000));
      await SystemJS.import('angular-mocks');
      const { configure } = await SystemJS.import('enzyme');
      const { default: Adapter } = await SystemJS.import('enzyme-adapter-react-16');

      configure({ adapter: new Adapter() });

      await SystemJS.import('test/helpers/setup-isolated-system');
      await SystemJS.import('test/helpers/dsl');
      await SystemJS.import('test/helpers/hooks');
      await SystemJS.import('test/helpers/sinon');
      await SystemJS.import('test/helpers/contentful_mocks');
      await SystemJS.import('test/helpers/mocks/entity_editor_document');
      await SystemJS.import('test/helpers/mocks/cf_stub');
      await SystemJS.import('test/helpers/mocks/space_context');
      await SystemJS.import('prelude');
      await SystemJS.import('test/helpers/application');
      // await SystemJS.import('test/unit/access_control/');
      // await SystemJS.import('test/unit/access_control/role_list.controller.spec');
      // await SystemJS.import('test/unit/access_control/role_list.directive.spec');
      await Promise.all(
        testModules.reduce((memo, name) => {
          if (name.startsWith('test/unit/access_control')) {
            memo.push(SystemJS.import(name));
          }

          return memo;
        }, [])
      );
      // await Promise.all(testModules.map(name => SystemJS.import(name)));

      start(...args);
    } catch (e) {
      // We need to call this in a new context so that Karma’s window.onerror
      // handler picks it up. If we throw it in a Promise the browser will raise
      // an `uncaughtRejection` event.

      window.setTimeout(() => {
        throw e;
      });
    }
  };

  /**
   * Register a module with SystemJS
   *
   * If the module ID ends in 'spec' we also register this as a test module that
   * we will load eagerly later.
   */
  function register(id, deps, run) {
    SystemJS.testRegistry.push([id, deps, run]);
    registerInSystemJS(id, deps, run);

    registerDirectoryAlias(id);

    if (id.startsWith('test/unit') || id.startsWith('test/integration')) {
      testModules.push(id);
    }
  }

  function registerLibrary(name, dep) {
    window.SystemJS.register(name, [], export_ => {
      const exports = dep;
      export_(Object.assign({ default: exports }, exports));
      return {
        setters: [],
        execute: function() {}
      };
    });
  }

  /**
   * If module ID matches 'a/b/index.es6.js' then also register as 'a/b'.
   */
  function registerDirectoryAlias(moduleId) {
    const path = moduleId.split('/');
    const last = path.pop();
    if (last === 'index.es6') {
      SystemJS.register(path.join('/'), [moduleId], $export => ({
        setters: [$export]
      }));
    }
  }
})();

function ensureLeadingSlash(x = '') {
  if (x.charAt(0) === '/') {
    return x;
  } else {
    return '/' + x;
  }
}
