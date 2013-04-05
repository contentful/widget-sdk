'use strict';

angular.module('contentful/controllers').controller('EntryListActionsCtrl', function EntryListCtrl($scope) {

  var _cacheSelected;

  // At the beginning of every digest cycle destroy the cache of selected entries
  $scope.$watch(function () { _cacheSelected = null; });

  var getSelected = function () {
    // Memoize result of getSelected call for duration of cycle
    if (_cacheSelected === null || _cacheSelected === undefined) {
      _cacheSelected = $scope.selection.getSelected($scope.entries);
    }
    return _cacheSelected;
  };

  var every = function (predicate) {
    return _.every(getSelected(), function (entry) {
      return entry[predicate]();
    });
  };

  var forAllEntries = function(callback) {
    var entries = $scope.selection.getSelected();
    _.each(entries, callback);
  };

  var makeAfterCallback = function() {
    var num = $scope.selection.size();
    return _.after(num, function() {
      $scope.$apply();
      //TODO adjust counts
    });
  };

  var perform = function(method) {
    var afterCallback = makeAfterCallback();
    forAllEntries(function(entry) {
      entry[method](afterCallback);
    });
  };

  $scope.publishSelected = function() {
    var afterCallback = makeAfterCallback();
    forAllEntries(function(entry) {
      entry.publish(entry.data.sys.version, afterCallback);
    });
  };

  $scope.unpublishSelected = function() {
    perform('unpublish');
  };

  $scope.deleteSelected = function() {
    perform('delete');
  };

  $scope.archiveSelected = function() {
    perform('archive');
  };

  $scope.unarchiveSelected = function() {
    perform('unarchive');
  };

  $scope.showDelete = function () {
    return every('canDelete');
  };

  $scope.showArchive = function () {
    return every('canArchive');
  };

  $scope.showUnarchive = function () {
    return every('canUnarchive');
  };

  $scope.showUnpublish = function () {
    return every('canUnpublish');
  };

  $scope.showPublish = function () {
    return every('canPublish');
  };

  $scope.publishButtonName = function () {
    var published = 0;
    var unpublished = 0;
    _.each(getSelected(), function (entry) {
      if (entry.isPublished()) {
        published++;
      } else {
        unpublished++;
      }
    });
    if (  published === 0) return 'Publish';
    if (unpublished === 0) return 'Republish';
    return '(Re)publish';
  };
});
