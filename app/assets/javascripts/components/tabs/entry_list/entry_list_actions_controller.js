'use strict';

angular.module('contentful').controller('EntryListActionsCtrl', function EntryListActionsCtrl($scope, notification, analytics) {

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

  var clearSelection = function () {
    $scope.selection.removeAll();
    _cacheSelected = null;
  };

  var every = function (predicate) {
    return _.every(getSelected(), function (entry) {
      return entry[predicate]();
    });
  };

  var forAllEntries = function(callback) {
    var entries = getSelected();
    _.each(entries, callback);
  };

  var makeApplyLater = function(callback) {
    var num = $scope.selection.size();
    var numCalled = 0;
    var results = [];
    return function(err) {
      numCalled++;
      results.push({
        err: err,
        rest: Array.prototype.slice.call(arguments, 1)
      });
      if (numCalled === num)
        $scope.$apply(_.partial(callback, results));
    };
  };

  function makeBatchResultsNotifier(word) {
    return function(results) {
      var hasFailed = function(r) { return r.err; };
      var failed = _.filter(results, hasFailed);
      var succeeded = _.reject(results, hasFailed);
      if (succeeded.length > 0)
        notification.info(succeeded.length + ' entries ' + word + ' successfully');
      if (failed.length > 0)
        notification.error(failed.length + ' entries could not be ' + word);
    };
  }

  var perform = function(method, callback) {
    var applyLater = makeApplyLater(callback);
    forAllEntries(function(entry) {
      entry[method](applyLater);
    });
    clearSelection();
    analytics.track('Performed EntryList action', {action: method});
  };

  $scope.publishSelected = function() {
    var applyLater = makeApplyLater(makeBatchResultsNotifier('published'));
    forAllEntries(function(entry) {
      entry.publish(entry.data.sys.version, applyLater);
    });
    clearSelection();
    analytics.track('Performed EntryList action', {action: 'publish'});
  };

  $scope.unpublishSelected = function() {
    perform('unpublish', makeBatchResultsNotifier('unpublished'));
  };

  $scope.duplicateSelected = function() {
    var notifier = makeBatchResultsNotifier('duplicated');
    var applyLater = makeApplyLater(function (results) {
      var successes = _(results).reject('err').pluck('rest').pluck('0').value();
      $scope.entries.unshift.apply($scope.entries, successes);
      notifier(results);
    });
    forAllEntries(function (entry) {
      duplicate(entry, applyLater);
    });
    clearSelection();
    analytics.track('Performed EntryList action', {action: 'duplicate'});

    function duplicate(entry, callback) {
      var contentType = entry.data.sys.contentType.sys.id;
      var data = _.omit(entry.data, 'sys');
      $scope.spaceContext.space.createEntry(contentType, data, callback);
    }
  };

  $scope.deleteSelected = function() {
    var applyLater = makeApplyLater(makeBatchResultsNotifier('deleted'));
    forAllEntries(function(entry) {
      entry.delete(function (err, entry) {
        if (!err) $scope.broadcastFromSpace('entityDeleted', entry);
        applyLater();
      });
    });
    clearSelection();
    analytics.track('Performed EntryList action', {action: 'delete'});
  };

  $scope.archiveSelected = function() {
    perform('archive', makeBatchResultsNotifier('archived'));
  };

  $scope.unarchiveSelected = function() {
    perform('unarchive', makeBatchResultsNotifier('unarchived'));
  };

  $scope.showDuplicate = function () {
    return $scope.can('create', 'Entry');
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
