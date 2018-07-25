'use strict';

/**
 * @ngdoc service
 * @name data/previewEnvironmentsCache
 */
angular.module('cf.data')
.factory('data/previewEnvironmentsCache', () => {
  let previewEnvironmentsCache;

  return {
    getAll: getAll,
    setAll: setAll,
    set: set,
    clearAll: clearAll
  };

  /**
   * @ngdoc method
   * @name data/previewEnvironmentsCache#getAll
   * @returns {object} environments
   *
   * @description
   * Returns the cached environments
   */
  function getAll () {
    return previewEnvironmentsCache;
  }

  /**
   * @ngdoc method
   * @name data/previewEnvironmentsCache#setAll
   * @param {object} environments
   * @returns {object} environments
   *
   * @description
   * Updates the cache with the environments provided
   */
  function setAll (environments) {
    previewEnvironmentsCache = environments;
    return previewEnvironmentsCache;
  }

  /**
   * @ngdoc method
   * @name data/previewEnvironmentsCache#set
   * @param {object} environment
   * @returns {object} environment
   *
   * @description
   * Updates a single environment in environments cache
   */
  function set (environment) {
    previewEnvironmentsCache = previewEnvironmentsCache || {};
    previewEnvironmentsCache[environment.sys.id] = environment;
    return environment;
  }

  /**
   * @ngdoc method
   * @name data/previewEnvironmentsCache#clearAll
   * @returns undefined
   *
   * @description
   * Clear the cache
   */
  function clearAll () {
    previewEnvironmentsCache = undefined;
  }
});
