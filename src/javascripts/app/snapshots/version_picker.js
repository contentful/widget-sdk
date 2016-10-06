'use strict';

angular.module('cf.app')

.factory('SnapshotComparatorController/versionPicker', function () {
  return {create: create};

  function create () {
    var pathsToRestore = [];
    var restoreFns = [];
    var differenceCount = 0;

    return {
      keep: keep,
      keepAll: function () { pathsToRestore = []; },
      restore: restore,
      registerRestoreFn: function (fn) { restoreFns.push(fn); },
      restoreAll: restoreAll,
      getPathsToRestore: getPathsToRestore,
      isUntouched: function () { return pathsToRestore.length < 1; },
      registerDifference: function () { differenceCount += 1; },
      getDifferenceCount: function () { return differenceCount; }
    };

    function keep (path) {
      _.pull(pathsToRestore, path.join('.'));
    }

    function restore (path) {
      pathsToRestore.push(path.join('.'));
    }

    function restoreAll () {
      restoreFns.forEach(function (fn) { fn(); });
    }

    function getPathsToRestore () {
      return pathsToRestore.map(function (path) {
        return path.split('.');
      });
    }
  }
});
