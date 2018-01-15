'use strict';

/**
 * @ngdoc service
 * @module contentful/mocks
 * @name mocks/TheStore/StorageWrapper
 * @description
 * Provides a service with the same interface as
 * `TheStore/StorageWrapper` but only holds values in memory.
 *
 * This service replaces the original service in the `contentful/mocks`
 * module.
 */
angular.module('contentful/mocks')
.factory('mocks/TheStore/ClientStorageWrapper', [function () {
  let localStore = {};

  return {
    _store: localStore,
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
