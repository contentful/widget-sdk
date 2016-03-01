'use strict';
angular.module('contentful')
.factory('entryReverter', [function () {
  return function create (entry) {
    var originalEntryData;
    var trackedPublishedVersion;
    var trackedPreviousVersion;

    return {
      init: init,
      getPreviousData: getPreviousData,
      revertedToPrevious: revertedToPrevious,
      canRevertToPrevious: canRevertToPrevious,
      revertedToPublished: revertedToPublished,
      canRevertToPublished: canRevertToPublished,
      publishedNewVersion: publishedNewVersion
    };

    function init () {
      originalEntryData = _.cloneDeep(entry.data);
      trackedPublishedVersion = entry.getPublishedVersion();
      trackedPreviousVersion = entry.getVersion();
    }

    function getPreviousData () {
      return originalEntryData;
    }

    function revertedToPrevious () {
      // Reset the published version in case it was already reverted earlier
      trackedPublishedVersion = entry.getPublishedVersion();
      trackedPreviousVersion = entry.getVersion();
    }

    function canRevertToPrevious () {
      return entry.getVersion() > trackedPreviousVersion;
    }

    function revertedToPublished () {
      if (trackedPreviousVersion === (trackedPublishedVersion + 1)) {
        trackedPreviousVersion = entry.getVersion() + 1;
      }
      trackedPublishedVersion = entry.getVersion();
    }

    function canRevertToPublished () {
      return entry.isPublished() &&
             entry.getVersion() > (trackedPublishedVersion + 1);
    }

    function publishedNewVersion () {
      var publishedVersion = entry.getPublishedVersion();
      if (trackedPreviousVersion === publishedVersion) {
        trackedPreviousVersion = publishedVersion + 1;
      }
      trackedPublishedVersion = publishedVersion;
    }

  };

}]);
