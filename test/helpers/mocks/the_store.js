'use strict';

/**
 * @ngdoc service
 * @module contentful/mocks
 * @name mocks/utils/TheStore/StorageWrapper
 * @description
 * Provides a service with the same interface as
 * `TheStore/StorageWrapper` but only holds values in memory.
 *
 * This service replaces the original service in the `contentful/mocks`
 * module.
 */
angular.module('contentful/mocks')
.factory('mocks/utils/TheStore/StorageWrapper', [function () {
  let localStore = {};

  return {
    default: function () {
      return {
        getItem: function (key) {
          return localStore[key];
        },
        setItem: function (key, value) {
          localStore[key] = value + '';
        },
        removeItem: function (key) {
          delete localStore[key];
        },
        clear: function () {
          localStore = {};
        }
      };
    }
  };
}]);
