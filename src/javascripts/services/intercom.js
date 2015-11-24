'use strict';

angular.module('contentful').factory('intercom', ['$injector', function ($injector) {
  var $window = $injector.get('$window');

  var intercom = {
    isLoaded: isLoaded,
    open: openIntercom
  };

  function isLoaded () {
    return !!$window.Intercom;
  }

  function openIntercom () {
    if (isLoaded()) {
      $window.Intercom('showNewMessage');
    }
  }

  return intercom;
}]);
