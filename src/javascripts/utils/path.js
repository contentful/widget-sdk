'use strict';

angular.module('cf.app')

/**
 * @ngdoc service
 * @module cf.app
 * @name utils/Path
 * @description
 * Helpers simplifying work with path arrays.
 */
.factory('utils/Path', [() => {
  return {
    isPrefix: isPrefix,
    isAffecting: isAffecting,
    findCommonPrefix: findCommonPrefix
  };

  /**
   * @ngdoc method
   * @name utils/Path#isAffecting
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
   * @name utils/Path#findCommonPrefix
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
    /* eslint no-constant-condition: off */
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
    var isCommon = _.every(values.slice(1), value => value === common);
    return isCommon ? common : null;
  }

  /**
   * @ngdoc method
   * @name utils/Path#isPrefix
   * @description
   * Returns true if the first argument is a prefix of the second one.
   *
   * @param {string[]} prefix
   * @param {string[]} path
   *
   * @usage[js]
   * isPrefix([], anything) // => true
   * isPrefix(['a', 'b'], ['a', 'b', 'c']) // => true
   * isAffecting(['a', 'b'], ['a']) // => false
   * isAffecting(['a', 'b'], ['a', 'c']) // => false
   */
  function isPrefix (prefix, target) {
    for (var i = 0; i < prefix.length; i++) {
      if (prefix[i] !== target[i]) {
        return false;
      }
    }
    return true;
  }
}]);
