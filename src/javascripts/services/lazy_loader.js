'use strict';

angular.module('contentful').factory('LazyLoader', ['$injector', function ($injector) {

  var $q         = $injector.get('$q');
  var $window    = $injector.get('$window');
  var $rootScope = $injector.get('$rootScope');
  var load       = $injector.get('angularLoad').loadScript;
  var env        = $injector.get('environment');
  var scripts    = $injector.get('LazyLoader/scripts');

  var store      = {};
  var cache      = {};

  $window.cfFeedLazyLoader = provide;

  return {
    provide: provide,
    get: get
  };

  function provide(name, value) {
    $rootScope.$apply(function () {
      store[name] = value;
    });
  }

  function get(name) {
    // no script definition at all
    var script = scripts[name];
    if (!script) {
      return $q.reject(new Error('No script with requested name.'));
    }

    // use cached promise
    var cached = cache[name];
    if (cached) { return cached; }

    // issue HTTP request to get value
    var loadPromise = load(getAssetUrl(script)).then(function () {
      var value = store[name];
      return value ? value : $q.reject(new Error('Script loaded, but no value provided.'));
    });

    cache[name] = loadPromise;
    return loadPromise;
  }

  function getAssetUrl(file) {
    return '//' + env.settings.asset_host.replace(/\/*$/, '') + '/' + file.replace(/^\/*/, '');
  }
}]);

angular.module('contentful').value('LazyLoader/scripts', {
  markdown: '/app/markdown_vendors.js'
});
