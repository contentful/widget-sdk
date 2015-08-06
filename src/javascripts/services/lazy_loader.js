'use strict';

angular.module('contentful').factory('LazyLoader', ['$injector', function ($injector) {

  var $q         = $injector.get('$q');
  var $window    = $injector.get('$window');
  var $rootScope = $injector.get('$rootScope');
  var load       = $injector.get('angularLoad').loadScript;
  var env        = $injector.get('environment');
  var packages   = $injector.get('LazyLoader/packages');
  var store      = {};

  $window.cfFeedLazyLoader = provide;

  return {
    provide: provide,
    get: get,
    _store: store,
    _packages: packages
  };

  function provide(name, value) {
    $rootScope.$apply(function () {
      store[name] = value;
    });
  }

  function get(name) {
    // no package definition at all
    var definition = packages[name];
    if (!definition) {
      return $q.reject(new Error('No definition for requested value.'));
    }

    // check if package can be derived from global values
    var globalValue = _.isFunction(definition.fromGlobal) ? definition.fromGlobal() : null;
    if (globalValue) {
      return $q.when(globalValue);
    }

    // use cached package
    var value = store[name];
    if (value) {
      return $q.when(value);
    }

    // issue request to get value
    return load(getAssetUrl(definition.script)).then(function () {
      var value = store[name];
      return value ? value : $q.reject(new Error('Script loaded, but no value provided.'));
    });
  }

  function getAssetUrl(file) {
    return '//' + env.settings.asset_host.replace(/\/*$/, '') + '/' + file.replace(/^\/*/, '');
  }
}]);

angular.module('contentful').value('LazyLoader/packages', {
  markdown: {
    script: '/app/markdown_vendors.js',
    fromGlobal: function () {
      if (window.CodeMirror && window.marked) {
        return { CodeMirror: window.CodeMirror, marked: window.marked };
      }
    }
  }
});
