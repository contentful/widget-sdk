'use strict';

angular.module('contentful').controller('AssetListActionsController', ['$scope', 'listActions', function AssetListActionsController($scope, listActions) {

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

  var batchPerformer = listActions.createBatchPerformer({
    getSelected: getSelected,
    clearSelection: clearSelection,
    entityName: 'Asset',
    entityNamePlural: 'Assets',
  });

  var every = function (predicate) {
    var selected = getSelected();
    return !_.isEmpty(selected) && _.every(selected, function (asset) {
      return asset[predicate]();
    });
  };

  $scope.publishSelected = function() {
    batchPerformer.perform({
      method: 'publish',
      getterForMethodArgs: ['getVersion'],
      callback: batchPerformer.makeBatchResultsNotifier('published')
    });
  };

  $scope.unpublishSelected = function() {
    batchPerformer.perform({
      method: 'unpublish',
      callback: batchPerformer.makeBatchResultsNotifier('unpublished')
    });
  };

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

  $scope.showDelete = function () {
    return !$scope.permissionController.get('deleteAsset', 'shouldHide') && every('canDelete');
  };

  $scope.showArchive = function () {
    return !$scope.permissionController.get('archiveAsset', 'shouldHide') && every('canArchive');
  };

  $scope.showUnarchive = function () {
    return !$scope.permissionController.get('unarchiveAsset', 'shouldHide') && every('canUnarchive');
  };

  $scope.showUnpublish = function () {
    return !$scope.permissionController.get('unpublishAsset', 'shouldHide') && every('canUnpublish');
  };

  $scope.showPublish = function () {
    return !$scope.permissionController.get('publishAsset', 'shouldHide') && every('canPublish');
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
}]);
