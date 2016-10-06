'use strict';

angular.module('cf.app')
/**
 * @ngdoc service
 * @module cf.app
 * @name SnapshotComparatorController/versionPicker
 * @description
 * A service tracking the process of
 * field version selection.
 */
.factory('SnapshotComparatorController/versionPicker', function () {
  return {create: create};

  function create () {
    var pathsToRestore = [];
    var restoreFns = [];
    var differenceCount = 0;

    return {
      keep: keep,
      keepAll: keepAll,
      restore: restore,
      registerPath: registerPath,
      restoreAll: restoreAll,
      getPathsToRestore: getPathsToRestore,
      getDifferenceCount: getDifferenceCount
    };

    /**
     * @ngdoc method
     * @name versionPicker#keep
     * @param {array} path
     * @description
     * Marks path as "kept": current version
     * should be used
     */
    function keep (path) {
      _.pull(pathsToRestore, path.join('.'));
    }

    /**
     * @ngdoc method
     * @name versionPicker#keepAll
     * @description
     * Marks all paths as "kept"
     */
    function keepAll () {
      pathsToRestore = [];
    }

    /**
     * @ngdoc method
     * @name versionPicker#restore
     * @param {array} path
     * @description
     * Marks path as "restored": snapshot
     * version should be used
     */
    function restore (path) {
      pathsToRestore.push(path.join('.'));
    }

    /**
     * @ngdoc method
     * @name versionPicker#registerPath
     * @param {object} spec
     * @description
     * Control for each path should register
     * itself. There are two options:
     * - restoreFn - action that should be
     *   performed when path is restored
     * - isDifferent - boolean flag
     */
    function registerPath (spec) {
      restoreFns.push(spec.restoreFn || _.noop);
      if (spec.isDifferent) {
        differenceCount += 1;
      }
    }

    /**
     * @ngdoc method
     * @name versionPicker#restoreAll
     * @description
     * Calls "restoreFn" of all paths
     */
    function restoreAll () {
      restoreFns.forEach(function (fn) {
        fn();
      });
    }

    /**
     * @ngdoc method
     * @name versionPicker#getPathsToRestore
     * @returns {string[][]}
     * @description
     * Gets an array of paths to restore
     */
    function getPathsToRestore () {
      return pathsToRestore.map(function (path) {
        return path.split('.');
      });
    }

    /**
     * @ngdoc method
     * @name versionPicker#getDifferenceCount
     * @returns {number}
     * @description
     * Gets an array of paths to restore
     */
    function getDifferenceCount () {
      return differenceCount;
    }
  }
});
