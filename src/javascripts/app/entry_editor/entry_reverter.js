'use strict';
angular.module('contentful')
.factory('entryReverter', [function () {
  return function create (getEntry) {
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
      var entry = getEntry();
      originalEntryData = _.cloneDeep(entry.data);
      trackedPublishedVersion = entry.getPublishedVersion();
      trackedPreviousVersion = entry.getVersion();
    }

    function getPreviousData () {
      return originalEntryData;
    }

    function revertedToPrevious () {
      var entry = getEntry();
      if (trackedPreviousVersion === (trackedPublishedVersion + 1)) {
        trackedPublishedVersion = entry.getVersion() - 1;
      }
      trackedPreviousVersion = entry.getVersion();
    }

    function canRevertToPrevious () {
      return getEntry().getVersion() > trackedPreviousVersion;
    }

    function revertedToPublished () {
      var entry = getEntry();
      if (trackedPreviousVersion === (trackedPublishedVersion + 1)) {
        trackedPreviousVersion = entry.getVersion() + 1;
      }
      trackedPublishedVersion = entry.getVersion();
    }

    function canRevertToPublished () {
      var entry = getEntry();
      return entry.isPublished() &&
             entry.getVersion() > (trackedPublishedVersion + 1);
    }

    function publishedNewVersion () {
      var publishedVersion = getEntry().getPublishedVersion();
      if (trackedPreviousVersion === publishedVersion) {
        trackedPreviousVersion = publishedVersion + 1;
      }
      trackedPublishedVersion = publishedVersion;
    }

  };

}]);
