/* global SystemJS window */
/**
 * This module sets up the SystemTest.register() where modules defined in the
 * `test/` folder register their presence.
 *
 * It also patches the Karma.start() function to load all test modules.
 */

//   const jq = window.libs.find(([name]) => name === 'jquery')[1];
//
//   window.jQuery = window.$ = jq;

(() => {
  // Will hold a list of all module IDs that define test cases
  const testModules = [];

  const registerInSystemJS = window.SystemJS.register.bind(window.SystemJS);

  window.SystemJS.register = register;
  window.testRegistry = [];

  window.libs.forEach(([name, dep]) => registerLibrary(name, dep));

  // window.jQuery = window.$ = window.custom$ = window.libs.find(([name]) => name === 'jquery')[1];

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
    // Check to see that every file in __karma__ is in System
    const fetchPromises = [];

    for (const filename of Object.keys(Karma.files)) {
      const prefixes = ['/base/src', '/base/test'];

      if (!prefixes.find(prefix => filename.startsWith(prefix))) {
        continue;
      }

      // Remove base and .js from the filename, and see if it's in the records
      let recordName;
      if (filename.startsWith('/base/src')) {
        recordName = filename.split('/base/src/javascripts/')[1];
      } else {
        recordName = filename.split('/base/')[1];
      }

      const ignoredFiles = ['test/system-config', 'test/prelude', 'libs/locales_list'];
      recordName = recordName.split('.js')[0];

      if (ignoredFiles.find(name => recordName === name)) {
        continue;
      }

      const normalizedRecordName = SystemJS.normalizeSync(recordName);

      if (!SystemJS[Object.getOwnPropertySymbols(SystemJS)[0]].records[normalizedRecordName]) {
        fetchPromises.push(
          window
            .fetch(filename)
            .then(resp => resp.text())
            .then(text => {
              eval(text);
            })
        );
      }
    }

    await Promise.all(fetchPromises);

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

      await SystemJS.import('angular-mocks');
      const { configure } = await SystemJS.import('enzyme');
      const { default: Adapter } = await SystemJS.import('enzyme-adapter-react-16');

      configure({ adapter: new Adapter() });

      await SystemJS.import('test/helpers/setup-isolated-system');
      await SystemJS.import('test/helpers/init_setup');
      await SystemJS.import('test/helpers/dsl');
      await SystemJS.import('test/helpers/hooks');
      await SystemJS.import('test/helpers/sinon');
      await SystemJS.import('test/helpers/matchers');
      await SystemJS.import('test/helpers/contentful_mocks');
      await SystemJS.import('test/helpers/mocks/entity_editor_document');
      await SystemJS.import('test/helpers/mocks/editor_context');
      await SystemJS.import('test/helpers/mocks/cf_stub');
      await SystemJS.import('test/helpers/mocks/space_context');
      await SystemJS.import('test/helpers/mocks/ot_doc');
      await SystemJS.import('test/helpers/mocks/widget_api');
      await SystemJS.import('test/helpers/application');
      await SystemJS.import('prelude');
      await Promise.all(
        testModules.reduce((memo, name) => {
          const prefixes = ['test/unit'];

          if (prefixes.find(prefix => name.startsWith(prefix))) {
            memo.push(SystemJS.import(name));
          }

          return memo;
        }, [])
      );

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
    window.testRegistry.push([id, deps, run]);
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
