'use strict';

angular.module('contentful').factory('get', ['require', function (require) {
  return function get(name){
    return require(name);
  };
}]);
