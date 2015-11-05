'use strict';

angular.module('contentful').factory('PolicyBuilder', [function () {
  return {
    internal: {
      from: function () {
        return {};
      }
    },
    external: {
      from: function () {
        return {};
      }
    }
  };
}]);
