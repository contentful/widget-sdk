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
angular.module('cf.ui', ['cf.utils']);
angular.module('contentful/environment', []);
angular.module('cf.forms', []);
/**
 * @ngdoc module
 * @name cf.data
 */
angular.module('cf.data', ['cf.utils', 'cf.libs']);
angular.module('cf.utils', ['cf.libs']);
angular.module('cf.es6', []);
/**
 * @ngdoc module
 * @name cf.app
 */
angular.module('cf.app', [
  'ui.router',
  'cf.utils',
  'cf.ui'
]);
/**
 * @ngdoc module
 * @name contentful
 */
angular.module('contentful', [
  'contentful/environment',
  'cf.es6',
  'cf.libs',
  'cf.app',
  'cf.ui',
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
angular.module('contentful/app', ['contentful'])
.config(['environment', '$compileProvider', function (environment, $compileProvider) {
  if (environment.env !== 'development') {
    $compileProvider.debugInfoEnabled(false);
  }
}])
.run(['require', function (require) {
  var authentication = require('authentication');
  authentication.login();

  require('utils/LaunchDarkly').init();
  require('presence').startTracking();
  require('uiVersionSwitcher').checkIfVersionShouldBeSwitched();
  require('navigation/stateChangeHandlers').setup();
  require('contextMenu').init();
  require('notification').setupClearMessageHooks();
  require('states').loadAll();
  require('dialogsInitController').init();
  require('navigation/DocumentTitle').init();
}]);

angular.module('contentful')
.config([
  '$locationProvider', '$compileProvider', '$animateProvider',
  function ($locationProvider, $compileProvider, $animateProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });

    // This is not actually used but prevents gobbling of fragments in
    // the URL, like the authentication token passed by gatekeeper.
    $locationProvider.hashPrefix('!!!');

    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|contentful):/);
    $animateProvider.classNameFilter(/animate/);
  }
]);

angular.module('cf.es6')
.constant('jquery', $)
.constant('lodash', _)
.constant('dotty', dotty);


(function () {
  window.System = {
    register: register
  };

  function register (id, deps, run) {
    registerDirectoryAlias(id);
    angular.module('cf.es6')
    .factory(id, ['require', function (require) {
      var mod = makeModule();

      var ctx = run(mod.export);

      deps.forEach(function (name, i) {
        var absName = resolve(name, id);
        var depExports = coerceExports(require(absName));
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
    }]);
  }

  /**
   * If 'exports' is an ES6 module return it, otherwise coerce it from
   * CommonJS exports to an ES6 module
   */
  function coerceExports (exports) {
    if (exports.__esModule) {
      return exports;
    } else {
      return _.assign({default: exports}, exports);
    }
  }

  function makeModule () {
    var exports = {};

    Object.defineProperty(exports, '__esModule', {
      value: true
    });

    return {
      export: export_,
      exports: exports
    };

    function export_ (name, value) {
      if (typeof name === 'string') {
        exports[name] = value;
      } else {
        for (var key in name) {
          exports[key] = name[key];
        }
      }
    }
  }

  function registerDirectoryAlias (moduleId) {
    var path = moduleId.split('/');
    var last = path.pop();
    if (last === 'index') {
      angular.module('cf.es6')
      .factory(path.join('/'), [moduleId, id]);
    }
  }

  function id (x) {
    return x;
  }

  function resolve (to, from) {
    // IE does not support string.startsWith()
    if (to.substr(0, 2) === './' || to.substr(0, 3) === '../') {
      var froms = from.split('/');
      froms.pop();
      var tos = to.split('/');
      return tos.reduce(function (resolved, seg) {
        if (seg === '..') {
          resolved.shift();
        } else if (seg !== '.') {
          resolved.push(seg);
        }

        return resolved;
      }, froms).join('/');
    } else {
      return to;
    }
  }
})();
