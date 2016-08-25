'use strict';

angular.module('cf.app')

/**
 * @ngdoc service
 * @module cf.app
 * @name PathUtils
 * @description
 * Helpers simplifying work with path arrays.
 */
.factory('entityEditor/Document/PathUtils', [function () {
  return {
    isAffecting: isAffecting,
    findCommonPrefix: findCommonPrefix
  };

  /**
   * @ngdoc method
   * @name PathUtils#isAffecting
   * @description
   * Returns true if a change to the value at 'changePath' in an object
   * affects the value of 'valuePath'.
   *
   * @usage[js]
   * isAffecting(['a'], []) // => true
   * isAffecting([], ['a']) // => true
   * isAffecting(['a'], ['a', 'b']) // => true
   * isAffecting(['a', 'b'], ['a', 'b']) // => true
   * isAffecting(['a', 'b', 'x'], ['a', 'b']) // => true
   *
   * isAffecting(['x'], ['a', 'b']) // => false
   * isAffecting(['a', 'x'], ['a', 'b']) // => false
   */
  function isAffecting (changePath, valuePath) {
    var m = Math.min(changePath.length, valuePath.length);
    return _.isEqual(changePath.slice(0, m), valuePath.slice(0, m));
  }

  /**
   * @ngdoc method
   * @name PathUtils#findCommonPrefix
   * @description
   * Given an array of paths (each of which is an array)
   * returns an array with the longest shared prefix
   * (that is: subarray) of those arrays (that is: paths).
   *
   * @usage[js]
   * findCommonPrefix([[], ['a', 'b']]) // => []
   * findCommonPrefix([['a'], ['b']]) // => []
   * findCommonPrefix([['a'], ['a', 'b']]) // => ['a']
   * findCommonPrefix([['a', 'b'], ['a', 'b', 'c']]) // => ['a', b']
   */
  function findCommonPrefix (paths) {
    return _(paths)
    .flatten()
    .sortBy()
    .chunk(paths.length)
    .map(function (chunk) {
      if (chunk.length === paths.length) {
        var uniq = _.sortedUniq(chunk);
        if (uniq.length === 1) {
          return uniq[0];
        }
      }
    })
    .compact()
    .value();
  }
}]);
