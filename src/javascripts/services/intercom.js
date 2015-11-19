'use strict';

angular.module('contentful').factory('intercom', ['$injector', function ($injector) {
  function Intercom (intercom) {
    this._intercom = intercom;
  }
  Intercom.prototype.isLoaded = function () {
    return !!this._intercom;
  };
  Intercom.prototype.open = function () {
    if (this.isLoaded()) {
      this._intercom('showNewMessage');
    }
  };

  var $window = $injector.get('$window');
  return new Intercom($window.Intercom);
}]);
