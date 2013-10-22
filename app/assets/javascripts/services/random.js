'use strict';
angular.module('contentful').factory('random', function(){
  var MAX_INT = Math.pow(2, 53);
  return {
    id: function () {
      return Math.floor((1 + Math.random()) * MAX_INT).toString(36);
    }
  };
});
