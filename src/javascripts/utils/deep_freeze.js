'use strict';

angular.module('cf.utils')
/**
 * @ngdoc service
 * @module cf.utils
 * @name utils/DeepFreeze
 */
.factory('utils/DeepFreeze', [function () {
  return {deepFreeze: deepFreeze};

  /**
   * @ngdoc method
   * @module cf.utils
   * @name utils/DeepFreeze#deepFreeze
   * @description
   * Freezes an object or array recursively and returns it.
   *
   * @param {object|array} target
   * @returns {object|array}
   */
  function deepFreeze (o) {
    if (Object.isFrozen(o)) {
      return o;
    }

    Object.freeze(o);

    if (_.isObject(o)) {
      Object.getOwnPropertyNames(o).forEach(function (prop) {
        deepFreeze(o[prop]);
      });
    } else if (Array.isArray(o)) {
      o.forEach(function (value) {
        deepFreeze(value);
      });
    }

    return o;
  }
}]);
