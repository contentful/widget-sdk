'use strict';

angular.module('contentful').factory('intercom', ['$injector', function ($injector) {
  var $window = $injector.get('$window');
  var intercom = {};

  intercom.isLoaded = function() {
    return !!$window.Intercom;
  };

  intercom.open = function() {
    if (!!this.isLoaded()) {
      $window.Intercom('showNewMessage');
    }
  }.bind(intercom);

  return intercom;
}]);
