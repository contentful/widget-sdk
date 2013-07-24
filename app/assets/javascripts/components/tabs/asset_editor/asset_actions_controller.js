angular.module('contentful').controller('AssetActionsCtrl', function AssetActionsCtrl($scope, notification, can) {
  'use strict';

  // TODO If we are sure that the data in the asset has been updated from the ShareJS doc,
  // We can query the asset instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.spaceContext.assetTitle($scope.asset) + '"';
  }

  $scope.delete = function () {
    $scope.asset.delete(function (err, asset) {
      $scope.$apply(function (scope) {
        if (err) {
          notification.error('Error deleting asset');
        }else{
          notification.info('Asset deleted successfully');
          scope.broadcastFromSpace('entityDeleted', asset);
        }
      });
    });
  };

  $scope.duplicate = function() {
    var data = _.omit($scope.asset.data, 'sys');

    $scope.spaceContext.space.createAsset(data, function(err, asset){
      $scope.$apply(function (scope) {
        if (!err) {
          scope.editAsset(asset);
        } else {
          notification.error('Could not duplicate Asset');
        }
      });
    });
  };

  $scope.archive = function() {
    $scope.asset.archive(function(err) {
      $scope.$apply(function() {
        if (err)
          notification.error('Error archiving ' + title() + ' (' + err.body.sys.id + ')');
        else
          notification.info(title() + ' archived successfully');
      });
    });
  };

  $scope.unarchive = function() {
    $scope.asset.unarchive(function(err) {
      $scope.$apply(function() {
        if (err)
          notification.error('Error unarchiving ' + title() + ' (' + err.body.sys.id + ')');
        else
          notification.info(title() + ' unarchived successfully');
      });
    });
  };

  $scope.unpublish = function () {
    $scope.asset.unpublish(function (err) {
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
    return $scope.can('create', 'Asset');
  };

  $scope.canDelete = function () {
    return $scope.asset.canDelete() && can('delete', $scope.asset.data);
  };

  $scope.canArchive = function () {
    return $scope.asset.canArchive() && can('archive', $scope.asset.data);
  };

  $scope.canUnarchive = function () {
    return $scope.asset.canUnarchive() && can('unarchive', $scope.asset.data);
  };

  $scope.canUnpublish = function () {
    return $scope.asset.canUnpublish() && can('unpublish', $scope.asset.data);
  };

  $scope.canPublish = function() {
    if (!$scope.otDoc) return false;
    var version = $scope.otDoc.version;
    var publishedVersion = $scope.otDoc.getAt(['sys', 'publishedVersion']);
    var updatedSincePublishing = version !== publishedVersion + 1;
    return this.asset.canPublish() && (!publishedVersion || updatedSincePublishing) && can('publish', $scope.asset.data);
  };

  $scope.publish = function () {
    var version = $scope.otDoc.version;
    // TODO reactivate when we have the schema ready, also delete the line marked further down
    //if (!$scope.validate()) {
      //notification.error('Error publishing ' + title() + ': ' + 'Validation failed');
      //return;
    //}
    $scope.asset.publish(version, function (err) {
      $scope.$apply(function(scope){
        if (err) {
          var errorId = err.body.sys.id;
          var reason;
          if (errorId === 'ValidationFailed') {
            reason = 'Validation failed';
            // TODO remove this line if client-side validations work again
            $scope.setValidationResult(err.body.details.errors, $scope.asset.data);
          } else if (errorId === 'VersionMismatch')
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

