'use strict';

/**
 * @ngdoc service
 * @module contentful/mocks
 * @name mocks/TheStore/localStorageWrapper
 * @description
 * Provides a service with the same interface as
 * `TheStore/localStorageWrapper` but only holds values in memory.
 *
 * This service replaces the original service in the `contentful/mocks`
 * module.
 */
angular.module('contentful/mocks')
.factory('mocks/TheStore/localStorageWrapper', [function () {
  let localStore = {};

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
}]);
