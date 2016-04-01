'use strict';

angular.module('contentful').controller('AssetListActionsController',
  ['$scope', 'listActions', '$injector', function AssetListActionsController($scope, listActions, $injector) {

  var accessChecker = $injector.get('accessChecker');

  var batchPerformer = listActions.createBatchPerformer({
    getSelected: $scope.selection.getSelected,
    clearSelection: $scope.selection.clear,
    entityName: 'Asset',
    entityNamePlural: 'Assets',
    onDelete: removeFromList
  });

  function removeFromList(entity) {
    var index = _.indexOf($scope.assets, entity);
    if (index > -1) {
      $scope.assets.splice(index, 1);
    }
  }

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
      callback: batchPerformer.makeBatchResultsNotifier('deleted')
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

  $scope.showDelete    = createShowChecker('delete', 'canDelete');
  $scope.showArchive   = createShowChecker('archive', 'canArchive');
  $scope.showUnarchive = createShowChecker('unarchive', 'canUnarchive');
  $scope.showPublish   = createShowChecker('publish', 'canPublish');
  $scope.showUnpublish = createShowChecker('unpublish', 'canUnpublish');

  function createShowChecker(action, predicate) {
    return function () {
      var selected = $scope.selection.getSelected();
      return _.isArray(selected) && selected.length > 0 &&  _.every(selected, function (asset) {
        return accessChecker.canPerformActionOnEntity(action, asset) && asset[predicate]();
      });
    };
  }

  $scope.publishButtonName = function () {
    var published = 0;
    var unpublished = 0;
    _.each($scope.selection.getSelected(), function (asset) {
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
