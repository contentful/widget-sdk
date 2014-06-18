'use strict';

angular.module('contentful').controller('EntryListActionsCtrl', function EntryListActionsCtrl($scope, $timeout, listActions) {

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

  var batchPerformer = listActions.createBatchPerformer({
    getSelected: getSelected,
    clearSelection: clearSelection,
    entityName: 'Entry',
    entityNamePlural: 'Entries',
  });

  var every = function (predicate) {
    return _.every(getSelected(), function (entry) {
      return entry[predicate]();
    });
  };

  $scope.publishSelected = function() {
    batchPerformer.perform({
      method: 'publish',
      methodArgGetters: ['getVersion'],
      callback: batchPerformer.makeBatchResultsNotifier('published')
    });
  };

  $scope.unpublishSelected = function() {
    batchPerformer.perform({
      method: 'unpublish',
      callback: batchPerformer.makeBatchResultsNotifier('unpublished')
    });
  };

  $scope.duplicateSelected = function() {
    var notifier = batchPerformer.makeBatchResultsNotifier('duplicated');

    batchPerformer.perform({
      method: 'duplicate',
      callback: function (results, length) {
        var successes =  _.reject(results, 'err');
        $scope.entries.unshift.apply($scope.entries, successes);
        notifier(results, length);
      },
      actionCallback: duplicateCallback
    });
  };

  function duplicateCallback(entry, params, deferred) {
    var contentType = entry.getSys().contentType.sys.id;
    var data = _.omit(entry.data, 'sys');
    $scope.spaceContext.space.createEntry(contentType, data, function (err, newEntry) {
      if(err) {
        if(err.statusCode === batchPerformer.getErrors().TOO_MANY_REQUESTS)
          $timeout(_.partial(duplicateCallback, entry, params, deferred), batchPerformer.getRetryTimeout());
        else
          deferred.reject({err: err});
      } else
        deferred.resolve(newEntry);
    });
  }

  $scope.deleteSelected = function() {
    batchPerformer.perform({
      method: 'delete',
      callback: batchPerformer.makeBatchResultsNotifier('deleted'),
      event: 'entityDeleted'
    });
  };

  $scope.archiveSelected = function() {
    batchPerformer.perform({
      method: 'archive',
      callback: batchPerformer.makeBatchResultsNotifier('archived')
    });
  };

  $scope.unarchiveSelected = function() {
    batchPerformer.perform({
      method: 'unarchive',
      callback: batchPerformer.makeBatchResultsNotifier('unarchived')
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
