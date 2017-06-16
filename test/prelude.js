/* global SystemJS window */
/**
 * This module sets up the SystemTest.register() where modules defined in the
 * `test/` folder register their presence.
 *
 * It also patches the Karam.start() function to load all test modules.
 */
(function () {
  // Will hold a list of all module IDs that define test cases
  const testModules = [];

  // All modules under `test/` will register here.
  window.SystemTest = {register};

  // Load ES6 modules defined in src/javascripts. They are registered in
  // `src/javascripts/prelude.js`.
  window.AngularSystem.registry.forEach((args) => register(...args));
  exposeAngularLibs();


  /**
   * We hook into karma start to make sure that we load all test modules before
   * we run the suites.
   */
  const Karma = window.__karma__;
  const start = Karma.start.bind(Karma);
  Karma.start = function (...args) {
    SystemJS.import('helpers/boot')
    .then(() => {
      return Promise.all(testModules.map((name) => SystemJS.import(name)));
    }).then(() => {
      start(...args);
    }, (err) => {
      // We need to call this in a new context so that Karma’s window.onerror
      // handler picks it up. If we throw it in a Promise the browser will raise
      // an `uncaughtRejection` event.
      window.setTimeout(function () {
        throw err;
      });
    });
  };


  /**
   * Register a module with SystemJS
   *
   * If the module ID ends in 'spec' we also register this as a test module that
   * we will load eagerly later.
   */
  function register (id, deps, run) {
    SystemJS.register(id, deps, run);
    registerDirectoryAlias(id);
    if (id.match(/(\.|_)spec$/)) {
      testModules.push(id);
    }
  }


  /**
   * Expose static Angular services to SystemJS.
   *
   * The service list is configured in `test/system-config.js`
   */
  function exposeAngularLibs () {
    const libInjector = angular.injector(['cf.libs', 'cf.es6']);
    SystemJS.exposeFromAngular.forEach(function (lib) {
      SystemJS.register(lib, [], function (export_) {
        const exports = libInjector.get(lib);
        export_(Object.assign({default: exports}, exports));
        return {
          setters: [],
          execute: function () {}
        };
      });
    });
  }

  /**
   * If module ID matches 'a/b/index.js' then also register as 'a/b'.
   */
  function registerDirectoryAlias (moduleId) {
    const path = moduleId.split('/');
    const last = path.pop();
    if (last === 'index') {
      SystemJS.register(path.join('/'), [moduleId], ($export) => ({
        setters: [$export]
      }));
    }
  }
})();
