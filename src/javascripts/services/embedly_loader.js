'use strict';

angular.module('contentful').factory('embedlyLoader', ['$injector', function ($injector) {
  var angularLoad = $injector.get('angularLoad'),
      $q          = $injector.get('$q'),
      $window     = $injector.get('$window');

  var SCRIPT_SRC = 'https://cdn.embedly.com/widgets/platform.js',
      defer = $q.defer(),
      loaded;

  function handleSuccess() {
    defer.resolve($window.embedly);
  }

  function handleError() {
    defer.reject();
  }

  return {
    load: function () {
      if (!loaded) {
        angularLoad.loadScript(SCRIPT_SRC).then(handleSuccess, handleError);
        loaded = defer.promise;
      }
      return loaded;
    }
  };
}]);
