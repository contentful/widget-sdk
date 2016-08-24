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
    var minLength = _.min(paths.map(_.property('length'))) || 0;
    var result = [];

    paths = paths.map(function (path) {
      return path.slice(0, minLength);
    });

    for (var i = 0; i < minLength; i += 1) {
      var first = paths[0][i];
      var allEqual = _.every(paths, function (path) {
        return path[i] === first;
      });

      if (allEqual) {
        result.push(first);
      } else {
        break;
      }
    }

    return result;
  }
}]);
