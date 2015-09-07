'use strict';

/**
 * @ngdoc service
 * @name LazyLoader
 *
 * @description
 * This service can be used to lazily load script dependencies.
 *
 * All the dependencies are defined in "LazyLoader/scripts" subservice.
 * If we "own" script that is lazy-load-enabled, we should call function
 * window.cfFeedLazyLoader with script name and an exported value.
 * If script just adds global value, define "globalObject" property.
 */
angular.module('contentful').factory('LazyLoader', ['$injector', function ($injector) {

  var $q         = $injector.get('$q');
  var $window    = $injector.get('$window');
  var $rootScope = $injector.get('$rootScope');
  var load       = $injector.get('angularLoad').loadScript;
  var scripts    = $injector.get('LazyLoader/scripts');

  var store      = {};
  var cache      = {};

  $window.cfFeedLazyLoader = function (name, value) {
    $rootScope.$apply(function () {
      provide(name, value);
    });
  };

  return {
    provide: provide,
    get: get
  };

  /**
   * @ngdoc method
   * @name LazyLoad#provide
   * @param {string} name
   * @param {*} value
   * @description
   * Feed Lazy Loader with the value for the given name.
   * There's no way to override already registered value.
   */
  function provide(name, value) {
    store[name] = store[name] || value;
  }

  /**
   * @ngdoc method
   * @name LazyLoad#get
   * @param {string} name
   * @return {Promise<*>}
   * @description
   * Lazy load the value with the given name.
   * This method returns promise of this value.
   * It will be rejected if requested script:
   * - is not registered,
   * - failed loading,
   * - loaded, but extracting value wasn't possible.
   */
  function get(name) {
    // no script definition at all
    var script = scripts[name];
    if (!script) {
      return $q.reject(new Error('No script with requested name.'));
    }

    // use cached promise
    var cached = cache[name];
    if (cached) { return cached; }

    // issue HTTP request to get service value
    var loadPromise = load(script.url).then(function () {
      if (script.globalObject) {
        store[name] = window[script.globalObject];
      }
      var value = store[name];
      return value ? value : $q.reject(new Error('Script loaded, but no value provided.'));
    });

    cache[name] = loadPromise;
    return loadPromise;
  }
}]);

angular.module('contentful').factory('LazyLoader/scripts', ['$injector', function ($injector) {
  var env = $injector.get('environment');

  /**
   * Options:
   * - url - absolute (in rare cases can be relative) URL
   * - globalObject - if scripts registers itself by global value,
   *                  it should be a key name within window object
   */
  return {
    markdown: {
      url: getAssetUrl('/app/markdown_vendors.js')
    },
    embedly: {
      url: 'https://cdn.embedly.com/widgets/platform.js',
      globalObject: 'embedly'
    }
  };

  function getAssetUrl(file) {
    var assetHost = dotty.get(env, 'settings.asset_host');
    var prefix =  assetHost ? '//' + assetHost.replace(/\/*$/, '') : '';
    return prefix + '/' + file.replace(/^\/*/, '');
  }
}]);
