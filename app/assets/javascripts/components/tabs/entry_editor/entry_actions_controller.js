angular.module('contentful').controller('EntryActionsCtrl', function EntryActionsCtrl($scope, notification, can) {
  'use strict';

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.spaceContext.entryTitle($scope.entry) + '"';
  }

  $scope.delete = function () {
    $scope.entry.delete(function (err, entry) {
      $scope.$apply(function (scope) {
        if (err) {
          notification.error('Error deleting entry');
        }else{
          notification.info('Entry deleted successfully');
          scope.broadcastFromSpace('entityDeleted', entry);
        }
      });
    });
  };

  $scope.duplicate = function() {
    var contentType = $scope.entry.data.sys.contentType.sys.id;
    var data = _.omit($scope.entry.data, 'sys');

    $scope.spaceContext.space.createEntry(contentType, data, function(err, entry){
      $scope.$apply(function (scope) {
        if (!err) {
          scope.editEntry(entry);
        } else {
          notification.error('Could not duplicate Entry');
          //TODO sentry notification
        }
      });
    });
  };

  $scope.archive = function() {
    $scope.entry.archive(function(err) {
      $scope.$apply(function() {
        if (err)
          notification.error('Error archiving ' + title() + ' (' + err.body.sys.id + ')');
        else
          notification.info(title() + ' archived successfully');
      });
    });
  };

  $scope.unarchive = function() {
    $scope.entry.unarchive(function(err) {
      $scope.$apply(function() {
        if (err)
          notification.error('Error unarchiving ' + title + ' (' + err.body.sys.id + ')');
        else
          notification.info(title() + ' unarchived successfully');
      });
    });
  };

  $scope.unpublish = function () {
    $scope.entry.unpublish(function (err) {
      $scope.$apply(function(scope){
        if (err) {
          notification.error('Error unpublishing ' + title() + ' (' + err.body.sys.id + ')');
        } else {
          notification.info(title() + ' unpublished successfully');
          scope.otUpdateEntity();
        }
      });
    });
  };

  $scope.canDuplicate = function () {
    return $scope.can('create', 'Entry');
  };

  $scope.canDelete = function () {
    return $scope.entry.canDelete() && can('delete', $scope.entry.data);
  };

  $scope.canArchive = function () {
    return $scope.entry.canArchive() && can('archive', $scope.entry.data);
  };

  $scope.canUnarchive = function () {
    return $scope.entry.canUnarchive() && can('unarchive', $scope.entry.data);
  };

  $scope.canUnpublish = function () {
    return $scope.entry.canUnpublish() && can('unpublish', $scope.entry.data);
  };

  $scope.canPublish = function() {
    if (!$scope.otDoc) return false;
    var version = $scope.otDoc.version;
    var publishedVersion = $scope.otDoc.getAt(['sys', 'publishedVersion']);
    var updatedSincePublishing = version !== publishedVersion + 1;
    return this.entry.canPublish() && (!publishedVersion || updatedSincePublishing) && can('publish', $scope.entry.data);
  };

  $scope.publish = function () {
    var version = $scope.otDoc.version;
    if (!$scope.validate()) {
      notification.warn('Error publishing ' + title() + ': ' + 'Validation failed');
      return;
    }
    $scope.entry.publish(version, function (err) {
      $scope.$apply(function(){
        if (err) {
          var errorId = err.body.sys.id;
          var reason;
          if (errorId === 'validationFailed')
            reason = 'Validation failed';
          else if (errorId === 'versionMismatch')
            reason = 'Can only publish most recent version';
          else
            reason = errorId;
          notification.error('Error publishing ' + title() + ': ' + reason);
        } else {
          notification.info(title() + ' published successfully');
        }
      });
    });
  };

  $scope.publishButtonLabel = function () {
    var publishedAt = null;
    try {
      publishedAt = $scope.otDoc.getAt(['sys', 'publishedAt']);
    } catch (e) { }

    if (publishedAt) {
      return 'Republish';
    } else {
      return 'Publish';
    }
  };

});

