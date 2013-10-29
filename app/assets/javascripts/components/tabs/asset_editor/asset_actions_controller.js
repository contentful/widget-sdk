angular.module('contentful').controller('AssetActionsCtrl', function AssetActionsCtrl($scope, notification) {
  'use strict';

  // TODO If we are sure that the data in the asset has been updated from the ShareJS doc,
  // We can query the asset instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.spaceContext.assetTitle($scope.asset) + '"';
  }

  $scope['delete'] = function () {
    $scope.asset['delete'](function (err, asset) {
      $scope.$apply(function (scope) {
        if (err) {
          notification.serverError('Error deleting Asset', err);
        }else{
          notification.info('Asset deleted successfully');
          scope.broadcastFromSpace('entityDeleted', asset);
        }
      });
    });
  };

  $scope.archive = function() {
    $scope.asset.archive(function(err) {
      $scope.$apply(function() {
        if (err)
          notification.serverError('Error archiving ' + title() + ' (' + err.body.sys.id + ')', err);
        else
          notification.info(title() + ' archived successfully');
      });
    });
  };

  $scope.unarchive = function() {
    $scope.asset.unarchive(function(err) {
      $scope.$apply(function() {
        if (err)
          notification.serverError('Error unarchiving ' + title() + ' (' + err.body.sys.id + ')', err);
        else
          notification.info(title() + ' unarchived successfully');
      });
    });
  };

  $scope.unpublish = function () {
    $scope.asset.unpublish(function (err) {
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
    var version = $scope.asset.getVersion();
    if (!$scope.validate()) {
      notification.warn('Error publishing ' + title() + ': ' + 'Validation failed');
      return;
    }
    $scope.asset.publish(version, function (err) {
      $scope.$apply(function(scope){
        if (err) {
          var errorId = err.body.sys.id;
          var reason;
          if (errorId === 'ValidationFailed') {
            reason = 'Validation failed';
            scope.setValidationErrors(err.body.details.errors);
          } else if (errorId === 'VersionMismatch')
            reason = 'Can only publish most recent version';
          else
            reason = errorId;
          notification.serverError('Error publishing ' + title() + ': ' + reason, err);
        } else {
          scope.asset.setPublishedVersion(version);
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

