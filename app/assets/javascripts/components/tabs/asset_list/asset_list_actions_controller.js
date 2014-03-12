'use strict';

angular.module('contentful').controller('AssetListActionsCtrl', function AssetListActionsCtrl($scope, listActions) {

  var _cacheSelected;

  // At the beginning of every digest cycle destroy the cache of selected assets
  $scope.$watch(function () { _cacheSelected = null; });

  var getSelected = function () {
    // Memoize result of getSelected call for duration of cycle
    if (_cacheSelected === null || _cacheSelected === undefined) {
      _cacheSelected = $scope.selection.getSelected($scope.assets);
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
    entityName: 'Asset',
    entityNamePlural: 'Assets',
  });
  var perform = performer.perform;
  var makeBatchResultsNotifier = performer.makeBatchResultsNotifier;

  var every = function (predicate) {
    return _.every(getSelected(), function (asset) {
      return asset[predicate]();
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

  $scope.showDelete = function () {
    return $scope.can('delete', 'Asset') && every('canDelete');
  };

  $scope.showArchive = function () {
    return $scope.can('archive', 'Asset') && every('canArchive');
  };

  $scope.showUnarchive = function () {
    return $scope.can('unarchive', 'Asset') && every('canUnarchive');
  };

  $scope.showUnpublish = function () {
    return $scope.can('unpublish', 'Asset') && every('canUnpublish');
  };

  $scope.showPublish = function () {
    return $scope.can('publish', 'Asset') && every('canPublish');
  };

  $scope.publishButtonName = function () {
    var published = 0;
    var unpublished = 0;
    _.each(getSelected(), function (asset) {
      if (asset.isPublished()) {
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
