'use strict';

angular.module('cf.utils')
.factory('require', ['$injector', function ($injector) {
  return $injector.get;
}]);
