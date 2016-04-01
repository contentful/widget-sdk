'use strict';

angular.module('contentful')
.controller('EntryListActionsController', ['$scope', '$injector', function EntryListActionsController ($scope, $injector) {

  var accessChecker        = $injector.get('accessChecker');
  var createBatchPerformer = $injector.get('batchPerformer');

  var batchPerformer = createBatchPerformer({
    getSelected: $scope.selection.getSelected,
    clearSelection: $scope.selection.clear,
    entityName: 'Entry',
    entityNamePlural: 'Entries',
    onDelete: removeFromList
  });

  function removeFromList(entity) {
    var index = _.indexOf($scope.entries, entity);
    if (index > -1) {
      $scope.entries.splice(index, 1);
      $scope.paginator.numEntries -= 1;
    }
  }

  $scope.publishSelected = function() {
    batchPerformer.run({
      method: 'publish',
      callback: batchPerformer.makeResultNotifier('published')
    });
  };

  $scope.unpublishSelected = function() {
    batchPerformer.run({
      method: 'unpublish',
      callback: batchPerformer.makeResultNotifier('unpublished')
    });
  };

  $scope.duplicateSelected = function() {
    var notifier = batchPerformer.makeResultNotifier('duplicated');

    batchPerformer.run({
      method: 'duplicate',
      callback: function (succeeded, failed) {
        $scope.entries.unshift.apply($scope.entries, succeeded);
        $scope.paginator.numEntries += succeeded.length;
        notifier(succeeded, failed);
      }
    });
  };

  $scope.deleteSelected = function() {
    batchPerformer.run({
      method: 'delete',
      callback: batchPerformer.makeResultNotifier('deleted')
    });
  };

  $scope.archiveSelected = function() {
    batchPerformer.run({
      method: 'archive',
      callback: batchPerformer.makeResultNotifier('archived')
    });
  };

  $scope.unarchiveSelected = function() {
    batchPerformer.run({
      method: 'unarchive',
      callback: batchPerformer.makeResultNotifier('unarchived')
    });
  };

  $scope.showDuplicate = function () {
    return !accessChecker.shouldHide('createEntry') &&
           !accessChecker.shouldDisable('createEntry');
  };
  $scope.showDelete    = createShowChecker('delete', 'canDelete');
  $scope.showArchive   = createShowChecker('archive', 'canArchive');
  $scope.showUnarchive = createShowChecker('unarchive', 'canUnarchive');
  $scope.showPublish   = createShowChecker('publish', 'canPublish');
  $scope.showUnpublish = createShowChecker('unpublish', 'canUnpublish');

  function createShowChecker(action, predicate) {
    return function () {
      var selected = $scope.selection.getSelected();
      return _.isArray(selected) && selected.length > 0 &&  _.every(selected, function (entry) {
        return accessChecker.canPerformActionOnEntity(action, entry) && entry[predicate]();
      });
    };
  }

  $scope.publishButtonName = function () {
    var published = 0;
    var unpublished = 0;
    _.each($scope.selection.getSelected(), function (entry) {
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
}]);
