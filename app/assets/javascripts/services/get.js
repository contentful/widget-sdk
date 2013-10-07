'use strict';

angular.module('contentful').factory('get', function ($injector) {
  return function get(name){
    return $injector.get(name);
  };
});
