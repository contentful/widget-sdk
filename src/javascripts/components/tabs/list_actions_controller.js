'use strict';

angular.module('contentful')
.controller('ListActionsController', ['$scope', '$injector', 'entityType', function ListActionsController ($scope, $injector, entityType) {

  var accessChecker        = $injector.get('accessChecker');
  var createBatchPerformer = $injector.get('batchPerformer');

  var collection = entityType === 'entry' ? 'entries' : 'assets';

  var batchPerformer = this.batchPerformer = createBatchPerformer({
    entityType: entityType,
    getSelected: $scope.selection.getSelected,
    clearSelection: $scope.selection.clear,
    onDelete: removeFromList
  });

  $scope.publishButtonName = publishButtonName;
  $scope.showPublish       = createShowChecker('publish', 'canPublish');
  $scope.publishSelected   = batchPerformer.publish;
  $scope.showUnpublish     = createShowChecker('unpublish', 'canUnpublish');
  $scope.unpublishSelected = batchPerformer.unpublish;
  $scope.showDelete        = createShowChecker('delete', 'canDelete');
  $scope.deleteSelected    = batchPerformer.delete;
  $scope.showArchive       = createShowChecker('archive', 'canArchive');
  $scope.archiveSelected   = batchPerformer.archive;
  $scope.showUnarchive     = createShowChecker('unarchive', 'canUnarchive');
  $scope.unarchiveSelected = batchPerformer.unarchive;

  function createShowChecker (action, predicate) {
    return function () {
      var selected = $scope.selection.getSelected();
      return _.isArray(selected) && selected.length > 0 &&  _.every(selected, function (entity) {
        return accessChecker.canPerformActionOnEntity(action, entity) && entity[predicate]();
      });
    };
  }

  function removeFromList (entity) {
    var index = _.indexOf($scope[collection], entity);
    if (index > -1) {
      $scope[collection].splice(index, 1);
      $scope.paginator.numEntries -= 1;
    }
  }

  function publishButtonName () {
    var counts = _.transform($scope.selection.getSelected(), function (acc, entity) {
      acc[entity.isPublished() ? 'published' : 'unpublished'] += 1;
    }, {published: 0, unpublished: 0});

    if (counts.published === 0) {
      return 'Publish';
    } else if (counts.unpublished === 0) {
      return 'Republish';
    } else {
      return '(Re)publish';
    }
  }
}]);
