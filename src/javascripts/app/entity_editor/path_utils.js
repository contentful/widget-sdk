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
   *
   * @param {string[][]} paths
   * @returns {string[]}
   */
  function findCommonPrefix (paths) {
    if (paths.length === 1) {
      return paths[0];
    }

    var segments = _.zip.apply(_, paths);
    var prefix = [];
    var i = 0;
    /*eslint no-constant-condition: off*/
    while (true) {
      var common = getCommon(segments[i] || []);
      if (common) {
        prefix.push(common);
      } else {
        return prefix;
      }
      i++;
    }
  }

  function getCommon (values) {
    var common = values[0];
    var isCommon = _.every(values.slice(1), function (value) {
      return value === common;
    });
    return isCommon ? common : null;
  }
}]);
