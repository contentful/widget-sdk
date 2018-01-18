'use strict';

angular.module('contentful')

.controller('ListActionsController', ['$scope', 'require', 'entityType', function ListActionsController ($scope, require, entityType) {
  var accessChecker = require('access_control/AccessChecker');
  var batchPerformer = require('batchPerformer');

  var collection = entityType === 'Entry' ? 'entries' : 'assets';

  var performer = batchPerformer.create({
    entityType: entityType,
    getSelected: $scope.selection.getSelected,
    onComplete: $scope.selection.clear,
    onDelete: removeFromList
  });

  this.duplicate = performer.duplicate;

  $scope.publishButtonName = publishButtonName;

  $scope.showPublish = createShowChecker('publish', 'canPublish');
  $scope.publishSelected = performer.publish;

  $scope.showUnpublish = createShowChecker('unpublish', 'canUnpublish');
  $scope.unpublishSelected = performer.unpublish;

  $scope.showDelete = createShowChecker('delete', 'canDelete');
  $scope.deleteSelected = performer.delete;

  $scope.showArchive = createShowChecker('archive', 'canArchive');
  $scope.archiveSelected = performer.archive;

  $scope.showUnarchive = createShowChecker('unarchive', 'canUnarchive');
  $scope.unarchiveSelected = performer.unarchive;

  function createShowChecker (action, predicate) {
    return function () {
      var selected = $scope.selection.getSelected();
      return _.isArray(selected) && selected.length > 0 && _.every(selected, function (entity) {
        return accessChecker.canPerformActionOnEntity(action, entity) && entity[predicate]();
      });
    };
  }

  function removeFromList (entity) {
    var wasRemoved = removeFromCollection(entity);

    if (wasRemoved && $scope.paginator) {
      $scope.paginator.setTotal(function (total) {
        return total > 0 ? total - 1 : 0;
      });
    }
  }

  function removeFromCollection (entity) {
    var index = _.indexOf($scope[collection], entity);
    if (index > -1) {
      $scope[collection].splice(index, 1);
      return true;
    } else {
      return false;
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
