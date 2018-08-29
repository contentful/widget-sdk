'use strict';

angular
  .module('cf.app')
  /**
   * @ngdoc service
   * @module cf.app
   * @name SnapshotComparatorController/versionPicker
   * @description
   * A service tracking the process of
   * field version selection.
   */
  .factory('SnapshotComparatorController/versionPicker', () => {
    return { create: create };

    function create() {
      let pathsToRestore = [];
      const restoreFns = [];
      let differenceCount = 0;

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
       * @name SnapshotComparatorController/versionPicker#keep
       * @param {array} path
       * @description
       * Marks path as "kept": current version
       * should be used
       */
      function keep(path) {
        _.pull(pathsToRestore, path.join('.'));
      }

      /**
       * @ngdoc method
       * @name SnapshotComparatorController/versionPicker#keepAll
       * @description
       * Marks all paths as "kept"
       */
      function keepAll() {
        pathsToRestore = [];
      }

      /**
       * @ngdoc method
       * @name SnapshotComparatorController/versionPicker#restore
       * @param {array} path
       * @description
       * Marks path as "restored": snapshot
       * version should be used
       */
      function restore(path) {
        const joined = path.join('.');
        if (pathsToRestore.indexOf(joined) < 0) {
          pathsToRestore.push(joined);
        }
      }

      /**
       * @ngdoc method
       * @name SnapshotComparatorController/versionPicker#registerPath
       * @param {object} spec
       * @description
       * Control for each path should register
       * itself. There are two options:
       * - restoreFn - action that should be
       *   performed when path is restored
       * - isDifferent - boolean flag
       */
      function registerPath(spec) {
        restoreFns.push(spec.restoreFn || _.noop);
        if (spec.isDifferent) {
          differenceCount += 1;
        }
      }

      /**
       * @ngdoc method
       * @name SnapshotComparatorController/versionPicker#restoreAll
       * @description
       * Calls "restoreFn" of all paths
       */
      function restoreAll() {
        restoreFns.forEach(fn => {
          fn();
        });
      }

      /**
       * @ngdoc method
       * @name SnapshotComparatorController/versionPicker#getPathsToRestore
       * @returns {string[][]}
       * @description
       * Gets an array of paths to restore
       */
      function getPathsToRestore() {
        return pathsToRestore.map(path => path.split('.'));
      }

      /**
       * @ngdoc method
       * @name SnapshotComparatorController/versionPicker#getDifferenceCount
       * @returns {number}
       * @description
       * Gets an array of paths to restore
       */
      function getDifferenceCount() {
        return differenceCount;
      }
    }
  });
