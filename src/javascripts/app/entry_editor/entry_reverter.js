'use strict';
angular.module('contentful')
.factory('entryReverter', [function () {
  return function create (entry) {
    var originalEntryData;
    var trackedPreviousVersion;

    return {
      init: init,
      getPreviousData: getPreviousData,
      revertedToPrevious: revertedToPrevious,
      canRevertToPrevious: canRevertToPrevious
    };

    function init () {
      originalEntryData = _.cloneDeep(entry.data);
      trackedPreviousVersion = entry.getVersion();
    }

    function getPreviousData () {
      return originalEntryData;
    }

    function revertedToPrevious () {
      trackedPreviousVersion = entry.getVersion();
    }

    function canRevertToPrevious () {
      return entry.getVersion() > trackedPreviousVersion;
    }
  };
}]);
