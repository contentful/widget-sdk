'use strict';

angular.module('contentful').factory('get', ['$injector', function ($injector) {
  return function get(name){
    return $injector.get(name);
  };
}]);
