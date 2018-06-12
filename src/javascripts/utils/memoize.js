'use strict';

angular.module('cf.utils')

/**
 * @ngdoc service
 * @module cf.utils
 * @name utils/memoize
 * @usage[js]
 * var memoize = require('utils/memoize')
 * var runOnce = memoize(function () {
 *   console.log('run')
 *   return true
 * })
 * runOnce() // Returns true and logs 'run'
 * runOnce() // Returns true
 */
.factory('utils/memoize', [() => function memoize (fn) {
  var result;
  var called = false;
  return () => {
    if (!called) {
      result = fn();
      called = true;
    }
    return result;
  };
}]);
