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
        notification.info(succeeded.length + ' Entries ' + word + ' successfully');
      if (failed.length > 0)
        notification.error(failed.length + ' Entries could not be ' + word);
    };
  }

  var perform = function(params) {
    var applyLater = makeApplyLater(params.callback);
    forAllEntries(function(entry) {
      entry[params.method](function(err, entry){
        if(!err && params.event) $scope.broadcastFromSpace(params.event, entry);
        applyLater(err);
      });
    });
    clearSelection();
    analytics.track('Performed EntryList action', {action: params.method});
  };

  $scope.publishSelected = function() {
    var applyLater = makeApplyLater(makeBatchResultsNotifier('published'));
    forAllEntries(function(entry) {
      entry.publish(entry.getVersion(), applyLater);
    });
    clearSelection();
    analytics.track('Performed EntryList action', {action: 'publish'});
  };

  $scope.unpublishSelected = function() {
    perform({
      method: 'unpublish',
      callback: makeBatchResultsNotifier('unpublished')
    });
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
      var contentType = entry.getSys().contentType.sys.id;
      var data = _.omit(entry.data, 'sys');
      $scope.spaceContext.space.createEntry(contentType, data, callback);
    }
  };

  $scope.deleteSelected = function() {
    perform({
      method: 'delete',
      callback: makeBatchResultsNotifier('deleted'),
      event: 'entityDeleted'
    });
  };

  $scope.archiveSelected = function() {
    perform({
      method: 'archive',
      callback: makeBatchResultsNotifier('archived')
    });
  };

  $scope.unarchiveSelected = function() {
    perform({
      method: 'unarchive',
      callback: makeBatchResultsNotifier('unarchived')
    });
  };

  $scope.showDuplicate = function () {
    return $scope.can('create', 'Entry');
  };

  $scope.showDelete = function () {
    return $scope.can('delete', 'Entry') && every('canDelete');
  };

  $scope.showArchive = function () {
    return $scope.can('archive', 'Entry') && every('canArchive');
  };

  $scope.showUnarchive = function () {
    return $scope.can('unarchive', 'Entry') && every('canUnarchive');
  };

  $scope.showUnpublish = function () {
    return $scope.can('unpublish', 'Entry') && every('canUnpublish');
  };

  $scope.showPublish = function () {
    return $scope.can('publish', 'Entry') && every('canPublish');
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
