angular.module('contentful').controller('EntryActionsCtrl', function EntryActionsCtrl($scope, notification) {
  'use strict';

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.spaceContext.entryTitle($scope.entry) + '"';
  }

  $scope['delete'] = function () {
    $scope.entry['delete'](function (err, entry) {
      $scope.$apply(function (scope) {
        if (err) {
          notification.serverError('Error deleting Entry', err);
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
          scope.navigator.entryEditor(entry).goTo();
        } else {
          notification.serverError('Could not duplicate Entry', err);
        }
      });
    });
  };

  $scope.archive = function() {
    $scope.entry.archive(function(err) {
      $scope.$apply(function() {
        if (err)
          notification.serverError('Error archiving ' + title() + ' (' + err.body.sys.id + ')', err);
        else
          notification.info(title() + ' archived successfully');
      });
    });
  };

  $scope.unarchive = function() {
    $scope.entry.unarchive(function(err) {
      $scope.$apply(function() {
        if (err)
          notification.serverError('Error unarchiving ' + title + ' (' + err.body.sys.id + ')', err);
        else
          notification.info(title() + ' unarchived successfully');
      });
    });
  };

  $scope.unpublish = function () {
    $scope.entry.unpublish(function (err) {
      $scope.$apply(function(scope){
        if (err) {
          notification.serverError('Error unpublishing ' + title() + ' (' + err.body.sys.id + ')', err);
        } else {
          notification.info(title() + ' unpublished successfully');
          scope.otUpdateEntity();
        }
      });
    });
  };

  $scope.publish = function () {
    var version = $scope.otDoc.version;
    if (!$scope.validate()) {
      notification.error('Error publishing ' + title() + ': ' + 'Validation failed');
      return;
    }
    $scope.entry.publish(version, function (err) {
      $scope.$apply(function(scope){
        if (err) {
          var errorId = err.body.sys.id;
          var reason;
          if (errorId === 'ValidationFailed') {
            reason = 'Validation failed';
            scope.setValidationErrors(err.body.details.errors);
          } else if (errorId === 'VersionMismatch') {
            reason = 'Can only publish most recent version';
          } else {
            reason = errorId;
          }
          notification.serverError('Error publishing ' + title() + ': ' + reason, err);
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

