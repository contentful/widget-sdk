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

  var performer = listActions.createPerformer({
    getSelected: getSelected,
    clearSelection: clearSelection,
    entityName: 'Entry',
    entityNamePlural: 'Entries',
  });
  var perform = performer.perform;
  var makeBatchResultsNotifier = performer.makeBatchResultsNotifier;

  var every = function (predicate) {
    return _.every(getSelected(), function (entry) {
      return entry[predicate]();
    });
  };

  $scope.publishSelected = function() {
    perform({
      method: 'publish',
      methodArgGetters: ['getVersion'],
      callback: makeBatchResultsNotifier('published')
    });
  };

  $scope.unpublishSelected = function() {
    perform({
      method: 'unpublish',
      callback: makeBatchResultsNotifier('unpublished')
    });
  };

  $scope.duplicateSelected = function() {
    var notifier = makeBatchResultsNotifier('duplicated');

    perform({
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
        if(err.statusCode === performer.ERRORS.TOO_MANY_REQUESTS)
          $timeout(_.partial(duplicateCallback, entry, params, deferred), performer.RETRY_TIMEOUT);
        else
          deferred.reject({err: err});
      } else
        deferred.resolve(newEntry);
    });
  }

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
