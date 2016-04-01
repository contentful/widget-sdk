'use strict';

angular.module('contentful').controller('EntryListActionsController', ['$scope', '$injector', function EntryListActionsController($scope, $injector) {
  var $q            = $injector.get('$q');
  var $timeout      = $injector.get('$timeout');
  var listActions   = $injector.get('listActions');
  var logger        = $injector.get('logger');
  var accessChecker = $injector.get('accessChecker');

  var batchPerformer = listActions.createBatchPerformer({
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

  function duplicateCallback(entry, params) {
    var sys = entry.getSys();
    if(!dotty.exists(sys, 'contentType.sys.id')){
      logger.logWarn('Content type does not exist', {
        data: {
          entry: entry
        }
      });
    }
    var contentType = dotty.get(sys, 'contentType.sys.id');
    var data = _.omit(entry.data, 'sys');
    return $scope.spaceContext.space.createEntry(contentType, data)
    .catch(function(err){
      if(err.statusCode === batchPerformer.getErrors().TOO_MANY_REQUESTS)
        return $timeout(_.partial(duplicateCallback, entry, params), batchPerformer.getRetryTimeout());
      else
        return $q.reject({err: err});
    });
  }

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
