'use strict';

angular.module('cf.data')
/**
 * @ngdoc service
 * @module cf.data
 * @name data/apiKeysCache
 * @description
 * Creates an API key cache for a space.
 *
 * Subsequent calls to `getDeliveryKeys` return
 * the original promise. `refresh` call fetches
 * API keys from the API again.
 */
.factory('data/apiKeysCache', [function () {
  return {create: create};

  function create (space) {
    var promise = null;

    return {
      getDeliveryKeys: getDeliveryKeys,
      refresh: refresh
    };

    function getDeliveryKeys () {
      return promise || refresh();
    }

    function refresh () {
      promise = space.getDeliveryApiKeys({limit: 1000});
      return promise;
    }
  }
}]);
