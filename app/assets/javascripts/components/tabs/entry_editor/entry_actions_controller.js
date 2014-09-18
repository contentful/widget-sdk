'use strict';
angular.module('contentful').controller('EntryActionsCtrl', ['$scope', 'notification', 'logger', function EntryActionsCtrl($scope, notification, logger) {

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.spaceContext.entryTitle($scope.entry) + '"';
  }

  $scope['delete'] = function () {
    $scope.entry['delete'](function (err, entry) {
      if (err) {
        notification.serverError('Error deleting Entry', err);
      }else{
        notification.info('Entry deleted successfully');
        $scope.broadcastFromSpace('entityDeleted', entry);
      }
    });
  };

  $scope.duplicate = function() {
    var contentType = $scope.entry.getSys().contentType.sys.id;
    var data = _.omit($scope.entry.data, 'sys');

    $scope.spaceContext.space.createEntry(contentType, data, function(err, entry){
      if (!err) {
        $scope.navigator.entryEditor(entry).goTo();
      } else {
        notification.serverError('Could not duplicate Entry', err);
      }
    });
  };

  $scope.archive = function() {
    $scope.entry.archive(function(err) {
      if (err) {
        notification.warn('Error archiving ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
        logger.logServerError('Error archiving entry', err);
      } else {
        notification.info(title() + ' archived successfully');
      }
    });
  };

  $scope.unarchive = function() {
    $scope.entry.unarchive(function(err) {
      if (err) {
        notification.warn('Error unarchiving ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
        logger.logServerError('Error unarchiving entry', err);
      } else {
        notification.info(title() + ' unarchived successfully');
      }
    });
  };

  $scope.unpublish = function () {
    $scope.entry.unpublish(function (err) {
      if (err) {
        notification.warn('Error unpublishing ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
        logger.logServerError('Error unpublishing entry', err);
      } else {
        notification.info(title() + ' unpublished successfully');
        $scope.otUpdateEntity();
      }
    });
  };

  $scope.publish = function () {
    var version = $scope.entry.getVersion();
    if (!$scope.validate()) {
      notification.warn('Error publishing ' + title() + ': ' + 'Validation failed');
      return;
    }
    $scope.entry.publish(version, function (err) {
      if (err) {
        var errorId = dotty.get(err, 'body.sys.id');
        if (errorId === 'ValidationFailed') {
          $scope.setValidationErrors(dotty.get(err, 'body.details.errors'));
          notification.warn('Error publishing ' + title() + ': Validation failed');
        } else if (errorId === 'VersionMismatch'){
          notification.warn('Error publishing ' + title() + ': Can only publish most recent version');
        } else {
          notification.serverError('Error publishing entry: ' + errorId, err);
        }
      } else {
        $scope.entry.setPublishedVersion(version);
        notification.info(title() + ' published successfully');
      }
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

}]);

