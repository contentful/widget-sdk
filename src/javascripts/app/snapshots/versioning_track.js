'use strict';

angular.module('cf.app')

.factory('track/versioning', ['require', function (require) {
  var analytics = require('analytics');
  var leaveConfirmator = require('navigation/confirmLeaveEditor');

  var data = {};
  var restoredVersions = {};

  return {
    setData: setData,
    noSnapshots: noSnapshots,
    opened: opened,
    closed: closed,
    restored: restored,
    registerRestoredVersion: registerRestoredVersion,
    publishedRestored: publishedRestored,
    trackableConfirmator: trackableConfirmator
  };

  function setData (user, entry, snapshot) {
    data = {
      user: user,
      entry: entry,
      snapshot: snapshot
    };
  }

  function noSnapshots (entryId) {
    track('no_snapshots', {entryId: entryId});
  }

  function opened (source) {
    track('snapshot_opened', _.extend({
      source: source || 'deepLink'
    }, basicInfo()));
  }

  function closed (discarded) {
    track('snapshot_closed', _.extend({
      changesDiscarded: !!discarded
    }, basicInfo()));
  }

  function restored (picker, showDiffsOnly) {
    var count = picker.getPathsToRestore().length;

    track('snapshot_restored', _.extend({
      fullRestore: count === picker.getDifferenceCount(),
      restoredFieldsCount: count,
      showDiffsOnly: !!showDiffsOnly
    }, basicInfo()));
  }

  function registerRestoredVersion (entry) {
    restoredVersions[entry.sys.id] = entry.sys.version;
  }

  function publishedRestored (entry) {
    var id = entry.sys.id;

    if (entry.sys.version - restoredVersions[id] < 2) {
      track('published_restored', {entryId: id});
    }
  }

  function trackableConfirmator (save) {
    var confirmator = leaveConfirmator(save, 'confirm_leave_comparison');

    return function () {
      return confirmator().then(function (result) {
        if (result && result.discarded) {
          closed(true);
        }

        return result;
      });
    };
  }

  function basicInfo () {
    var userId = data.user.sys.id;
    var ssys = data.snapshot.sys;

    return {
      userId: userId,
      entryId: data.entry.sys.id,
      snapshotId: ssys.id,
      snapshotType: ssys.snapshotType,
      authorIsUser: userId === ssys.createdBy.sys.id
    };
  }

  function track (event, data) {
    analytics.track('versioning:' + event, data);
  }
}]);
