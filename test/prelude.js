/* global SystemJS */
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
  window.testRegistry = [];

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
    // Check to see that every file in __karma__ is in System
    const fetchPromises = [];

    for (const filename of Object.keys(Karma.files)) {
      const prefixes = ['/base/src', '/base/test'];
      const ignoredExtensions = ['.json', '.html'];

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

      // Add these to the SystemJS map, so that they can be imported as they would be in Webpack
      if (ignoredExtensions.find(ext => filename.endsWith(ext))) {
        updateSystemMap(recordName, `${window.location.origin}${filename}`);
        continue;
      }

      /*
        Since ignored files are excluded by this point and registered in the SystemJS map above,
        we can assume that any files that get to this point, with a .js extension or not, are able
        to be "fetched" and evaulated.

        This means that any file that is not JS (like SVG) must be preprocessed by Babel (in karma.conf.js)
        or else this will break.
       */
      const ignoredFiles = ['test/system-config.js', 'test/prelude.js'];

      if (ignoredFiles.find(name => recordName === name)) {
        continue;
      }

      const recordNameWithoutExt = recordName
        .split('.')
        .slice(0, -1)
        .join('.');
      const ext = recordName.split('.').slice(-1)[0];

      const normalizedRecordName = SystemJS.normalizeSync(recordNameWithoutExt);

      if (!SystemJS[Object.getOwnPropertySymbols(SystemJS)[0]].records[normalizedRecordName]) {
        /*
          Due to the number of src and test files we're loading in Karma (which puts all JS files
          into script tags by default) Chrome has issues loading all at once and errs after loading
          a certain number of files. Below fetches those missing files and evaulates them, then
          registers the alias for that extension.
         */
        fetchPromises.push(
          window
            .fetch(filename)
            .then(resp => resp.text())
            .then(eval)
            .then(() => {
              registerFileWithExtAlias(recordNameWithoutExt, ext);
            })
        );
      } else {
        // The file was loaded successfully, so only register the alias
        registerFileWithExtAlias(recordNameWithoutExt, ext);
      }
    }

    await Promise.all(fetchPromises);

    try {
      // This needs to be registered early because prelude depends on it (and it not being in `this.system`);
      SystemJS.register('Config', [], _export => {
        _export({
          authUrl: x => `//be.test.com${ensureLeadingSlash(x)}`,
          apiUrl: x => `//api.test.com${ensureLeadingSlash(x)}`,
          websiteUrl: x => `//www.test.com${ensureLeadingSlash(x)}`,
          accountUrl: x => `//be.test.com/account${ensureLeadingSlash(x)}`,
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
            getstream_io: {}
          },
          readInjectedConfig: () => ({ config: {} })
        });

        return {
          setters: [],
          execute: function() {}
        };
      });

      const origInject = window.inject;

      window.inject = function(...args) {
        // debugger;

        origInject(...args);
      };

      await SystemJS.import('angular-mocks');
      const { configure } = await SystemJS.import('enzyme');
      const { default: Adapter } = await SystemJS.import('enzyme-adapter-react-16');

      configure({ adapter: new Adapter() });

      await SystemJS.import('test/helpers/setup-isolated-system');
      await SystemJS.import('test/utils/dsl');

      await SystemJS.import('test/helpers/$current-spec');
      await SystemJS.import('test/helpers/leaked-dom-elements');
      await SystemJS.import('test/helpers/sinon');
      await SystemJS.import('test/helpers/jasmine-matchers');

      await SystemJS.import('test/helpers/systemjs-mocks');

      await SystemJS.import('test/helpers/mocks');
      await SystemJS.import('test/helpers/mocks/entity_editor_document');
      await SystemJS.import('test/helpers/mocks/editor_context');
      await SystemJS.import('test/helpers/mocks/cf_stub');
      await SystemJS.import('test/helpers/mocks/space_context');
      await SystemJS.import('test/helpers/mocks/widget_api');

      await SystemJS.import('prelude');
      await Promise.all(testModules.map(name => SystemJS.import(name)));

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

  function updateSystemMap(key, value) {
    const config = SystemJS.getConfig();

    config.map[key] = value;

    SystemJS.config(config);
  }

  /**
   * The registration method for SystemJS. Original window.SystemJS.register is overridden above.
   */
  function register(id, deps, run) {
    // Add the registration to the `testRegistry` window variable, so that it can
    // be re-registered in the isolated SystemJS
    window.testRegistry.push([id, deps, run]);

    // Actually register in SystemJS
    registerInSystemJS(id, deps, run);

    registerDirectoryAliases(id);

    // Add these to a separate array, so that they can be imported separately above in Karma.start
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

  // Register an alias for a given `moduleId`
  function registerAlias(moduleId, alias) {
    SystemJS.register(alias, [moduleId], $export => ({
      setters: [$export]
    }));
  }

  /**
   * If module ID matches 'a/b/index.js' then register both 'a/b/' and 'a/b'.
   */
  function registerDirectoryAliases(moduleId) {
    const path = moduleId.split('/');
    const last = path.pop();
    if (last === 'index') {
      registerAlias(moduleId, path.join('/'));
      registerAlias(moduleId, `${path.join('/')}/`);
    }
  }

  function registerFileWithExtAlias(moduleId, ext) {
    registerAlias(moduleId, `${moduleId}.${ext}`);
  }
})();

function ensureLeadingSlash(x = '') {
  if (x.charAt(0) === '/') {
    return x;
  } else {
    return '/' + x;
  }
}
