/**
 * This file defines the System.register function that is used to
 * register ES6 modules.
 *
 * We also declare all the legacy Angular modules and provide their
 * configuration.
 */

// This enforces strict mode for _all_ files in the application code
// since we just concatenate them.
'use strict';

/**
 * @ngdoc module
 * @name cf.ui
 */
angular.module('contentful/environment', []);
angular.module('contentful/init', ['cf.utils']);
angular.module('cf.forms', ['cf.utils']);
/**
 * @ngdoc module
 * @name cf.data
 */
angular.module('cf.data', ['cf.utils', 'cf.es6']);
angular.module('cf.utils', ['cf.es6']);
angular.module('cf.es6', []);
/**
 * @ngdoc module
 * @name cf.app
 */
angular.module('cf.app', ['ui.router', 'cf.utils']);
/**
 * @ngdoc module
 * @name contentful
 */
angular.module('contentful', [
  'contentful/init',
  'contentful/environment',
  'cf.es6',
  'cf.app',
  'cf.forms',
  'cf.utils',
  'cf.data',
  'angularLoad',
  'ngAnimate',
  'ngSanitize',
  'ui.sortable',
  'ui.router'
]);

/**
 * @ngdoc module
 * @name contentful/app
 */
angular
  .module('contentful/app', ['contentful'])
  .config([
    'environment',
    '$compileProvider',
    (environment, $compileProvider) => {
      if (environment.env !== 'development') {
        $compileProvider.debugInfoEnabled(false);
      }
    }
  ])
  .run([
    'require',
    require => {
      const $document = require('$document');
      const Config = require('Config.es6');
      if (Config.env === 'development') {
        Error.stackTraceLimit = 100;
      } else {
        Error.stackTraceLimit = 25;
      }
      require('Debug.es6').init(window);
      require('Authentication.es6').init();
      require('services/TokenStore.es6').init();
      require('utils/LaunchDarkly').init();
      require('navigation/stateChangeHandlers').setup();
      require('ui/ContextMenuHandler.es6').default($document);
      require('states').loadAll();
      require('dialogsInitController').init();
      require('navigation/DocumentTitle.es6').init();
      require('components/shared/auto_create_new_space').init();

      const moment = require('moment');

      moment.locale('en', {
        calendar: {
          lastDay: '[Yesterday], LT',
          sameDay: '[Today], LT',
          nextDay: '[Tomorrow], LT',
          lastWeek: 'ddd, LT',
          nextWeek: '[Next] ddd, LT',
          sameElse: 'll'
        }
      });
    }
  ]);

angular
  .module('contentful')
  .config([
    '$locationProvider',
    $locationProvider => {
      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      });

      // This is not actually used but prevents gobbling of fragments in
      // the URL, like the authentication token passed by gatekeeper.
      $locationProvider.hashPrefix('!!!');
    }
  ])

  .config([
    '$compileProvider',
    $compileProvider => {
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|contentful):/);
    }
  ])

  .config([
    '$animateProvider',
    $animateProvider => {
      $animateProvider.classNameFilter(/animate/);
    }
  ])

  .config([
    '$httpProvider',
    $httpProvider => {
      // IE11 caches AJAX requests by default :facepalm: if we don’t set
      // these headers.
      // See: http://viralpatel.net/blogs/ajax-cache-problem-in-ie/
      $httpProvider.defaults.headers.common['Cache-Control'] = 'no-cache';
      $httpProvider.defaults.headers.common['If-Modified-Since'] = '0';
    }
  ]);

(() => {
  const registry = [];
  window.AngularSystem = {
    register: register,
    registry: registry,
    set: set
  };

  // Load the modules defined in `libs/`
  window.libs.forEach(lib => {
    set(lib[0], lib[1]);
  });

  /**
   * Analagous to angular.module().constant.
   * Registers the given `moduleObj` as a module
   * named `id` in SystemJS using a custom `run`
   * function.
   *
   * Sets the module on the `cf.es6` Angular module.
   * @param {String} id        Name of module
   * @param {Object} moduleObj Module object
   */
  function set(id, moduleObj) {
    registry.push([
      id,
      [],
      export_ => {
        const exports = moduleObj;
        export_(Object.assign({ default: exports }, exports));
        return {
          setters: [],
          execute: function() {}
        };
      }
    ]);

    angular.module('cf.es6').constant(id, moduleObj);
  }

  /**
   * Registers a module dynamically. Analagous
   * to angular.module().factory.
   *
   * @param  {String} id Module name
   * @param  {Array} deps Dependencies
   * @param  {Function} run  Function that is run to export the module
   */
  function register(id, deps, run) {
    registry.push([id, deps, run]);
    registerDirectoryAlias(id);

    angular.module('cf.es6').factory(id, [
      'require',
      require => {
        const mod = makeModule();

        const ctx = run(mod.export);

        deps.forEach((name, i) => {
          const absName = resolve(name, id);
          const depExports = coerceExports(require(absName));
          ctx.setters[i](depExports);
        });
        ctx.execute();

        // do not freeze exports while running unit
        // test so methods can be freely stubbed
        if (require('environment').env === 'unittest') {
          return mod.exports;
        } else {
          return Object.freeze(mod.exports);
        }
      }
    ]);
  }

  /**
   * If 'exports' is an ES6 module return it, otherwise coerce it from
   * CommonJS exports to an ES6 module
   */
  function coerceExports(exports) {
    if (exports.__esModule) {
      return exports;
    }

    // We don't use `React.PropTypes` since it's deprecated and warns
    // when accessing. Unfortunatelly the `assign` below will also
    // cause the warning. Here we detect if we're dealing with React
    // exports and if so we remove `PropTypes`.
    if (exports.Component && 'PropTypes' in exports) {
      delete exports.PropTypes;
    }

    return Object.assign({ default: exports }, exports);
  }

  function makeModule() {
    const exports = {};

    Object.defineProperty(exports, '__esModule', {
      value: true
    });

    return {
      export: export_,
      exports: exports
    };

    function export_(name, value) {
      if (typeof name === 'string') {
        exports[name] = value;
      } else {
        for (const key in name) {
          exports[key] = name[key];
        }
      }
    }
  }

  /**
   * If module ID matches 'a/b/index.es6' then register a module 'a/b'
   * that is an alias for the index module.
   */
  function registerDirectoryAlias(moduleId) {
    const path = moduleId.split('/');
    const last = path.pop();
    if (last === 'index.es6') {
      angular.module('cf.es6').factory(path.join('/'), [moduleId, id]);
    }
  }

  function id(x) {
    return x;
  }

  function resolve(to, from) {
    // IE does not support string.startsWith()
    if (to.substr(0, 2) === './' || to.substr(0, 3) === '../') {
      const froms = from.split('/');
      // Last 'from' is the filename but we resolve relative to the
      // directory.
      froms.pop();
      const tos = to.split('/');
      return tos
        .reduce((resolved, seg) => {
          if (seg === '..') {
            resolved.pop();
          } else if (seg !== '.') {
            resolved.push(seg);
          }

          return resolved;
        }, froms)
        .join('/');
    } else {
      return to;
    }
  }
})();
