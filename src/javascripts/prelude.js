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

import moment from 'moment';
import _ from 'lodash';

angular.module('contentful/init', []);

/**
 * @ngdoc module
 * @name contentful
 */
angular.module('contentful', [
  'contentful/init',
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
    '$document',
    '$injector',
    ($document, $injector) => {
      const Config = $injector.get('Config.es6');
      if (Config.env === 'development') {
        Error.stackTraceLimit = 100;
      } else {
        Error.stackTraceLimit = 25;
      }
      $injector.get('Debug.es6').init(window);
      $injector.get('Authentication.es6').init();
      $injector.get('services/TokenStore.es6').init();
      $injector.get('utils/LaunchDarkly').init();
      $injector.get('navigation/stateChangeHandlers').setup();
      $injector.get('ui/ContextMenuHandler.es6').default($document);
      $injector.get('states').loadAll();
      $injector.get('dialogsInitController').init();
      $injector.get('navigation/DocumentTitle.es6').init();
      $injector.get('components/shared/auto_create_new_space').init();
      $injector.get('Telemetry.es6').init();

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
    '$urlMatcherFactoryProvider',
    $urlMatcherFactoryProvider => {
      /*
       * We need to define a dumb type PathSuffix here and use that to
       * represent path suffixes for the Space Settings and Account
       * views, because otherwise UI-Router treats them as regular
       * URL parameters and does nasty things like escaping slashes.
       */
      $urlMatcherFactoryProvider.type('PathSuffix', {
        encode: function(val) {
          return val !== null ? val.toString() : val;
        },
        decode: function(val) {
          return val !== null ? val.toString() : val;
        },
        is: function(val) {
          return this.pattern.test(val);
        },
        pattern: /.*/
      });

      // Avoid being obsessive about matching states to trailing slashes
      $urlMatcherFactoryProvider.strictMode(false);
    }
  ])
  .config([
    '$provide',
    $provide => {
      // Decorates $q instances with the `callback` method
      $provide.decorator('$q', [
        '$delegate',
        '$rootScope',
        ($q, $rootScope) => {
          // Returns a callback method that should be passed in where a node-style callback is expected.
          // The callback method has a `promise` property that can then be passed around in a promise environment:
          //
          // var cb = $q.callback();
          // asyncMethod(cb);
          // cb.promise.then(...)
          //
          $q.callbackWithApply = () => {
            const deferred = $q.defer();
            const callbackFunction = function(err) {
              const args = _.tail(arguments);
              $rootScope.$apply(() => {
                if (err) {
                  deferred.reject(err);
                } else {
                  deferred.resolve(...args);
                }
              });
            };
            callbackFunction.promise = deferred.promise;
            return callbackFunction;
          };

          $q.callback = () => {
            const deferred = $q.defer();
            const callbackFunction = function(err) {
              const args = _.tail(arguments);
              if (err) {
                deferred.reject(err);
              } else {
                deferred.resolve(...args);
              }
            };
            callbackFunction.promise = deferred.promise;
            return callbackFunction;
          };

          /**
           * Usage:
           *
           * $q.denodeify(function (cb) {
           *   expectsNodeStyleCallback(cb)
           * })
           * .then(
           *   function (result) {},
           *   function (err) {})
           * )
           */
          $q.denodeify = fn =>
            $q((resolve, reject) => {
              try {
                fn(handler);
              } catch (error) {
                handler(error);
              }

              function handler(err, value) {
                if (err) {
                  reject(err);
                } else {
                  resolve(value);
                }
              }
            });

          return $q;
        }
      ]);
    }
  ])

  .config([
    '$httpProvider',
    'environment',
    ($httpProvider, environment) => {
      // IE11 caches AJAX requests by default :facepalm: if we don’t set
      // these headers.
      // See: http://viralpatel.net/blogs/ajax-cache-problem-in-ie/
      $httpProvider.defaults.headers.common['Cache-Control'] = 'no-cache';
      $httpProvider.defaults.headers.common['If-Modified-Since'] = '0';

      // Add header to denote UI traffic, so that information can be determined
      // in services like Librato
      //
      // See [CEP-0056] SDK User Agent Headers
      // https://contentful.atlassian.net/wiki/spaces/ENG/pages/122514052/CEP-0056+SDK+User+Agent+Headers
      const { gitRevision, settings } = environment;
      const headerParts = ['app contentful.web-app', 'platform browser'];

      // Add active git revision to headers
      if (gitRevision) {
        headerParts.push(`sha ${gitRevision}`);
      }

      // Add environment, so that local dev versus direct traffic can be differentiated
      if (settings.environment !== 'production') {
        headerParts.push(`env ${settings.environment}`);
      }

      $httpProvider.defaults.headers.common['X-Contentful-User-Agent'] = headerParts.join('; ');
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
   * Sets the module on the `contentful/init` Angular module.
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

    angular.module('contentful/init').constant(id, moduleObj);
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

    angular.module('contentful/init').factory(id, [
      '$injector',
      $injector => {
        const mod = makeModule();

        const ctx = run(mod.export);

        deps.forEach((name, i) => {
          const absName = resolve(name, id);
          const depExports = coerceExports($injector.get(absName));
          ctx.setters[i](depExports);
        });
        ctx.execute();

        // do not freeze exports while running unit
        // test so methods can be freely stubbed
        if ($injector.get('environment').env === 'unittest') {
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
      angular.module('contentful/init').factory(path.join('/'), [moduleId, id]);
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
