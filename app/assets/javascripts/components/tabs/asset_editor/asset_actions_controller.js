'use strict';
angular.module('contentful').controller('AssetActionsController', ['$scope', 'notification', 'logger', function AssetActionsController($scope, notification, logger) {
  // TODO If we are sure that the data in the asset has been updated from the ShareJS doc,
  // We can query the asset instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.spaceContext.assetTitle($scope.asset) + '"';
  }

  $scope.delete = function () {
    $scope.asset.delete()
    .then(function(asset){
      notification.info('Asset deleted successfully');
      $scope.broadcastFromSpace('entityDeleted', asset);
    })
    .catch(function(err){
      notification.serverError('Error deleting Asset', err);
    });
  };

  $scope.archive = function() {
    $scope.asset.archive()
    .then(function(){
      notification.info(title() + ' archived successfully');
    })
    .catch(function(err){
      notification.warn('Error archiving ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerError('Error archiving asset', err);
    });
  };

  $scope.unarchive = function() {
    $scope.asset.unarchive()
    .then(function(){
      notification.info(title() + ' unarchived successfully');
    })
    .catch(function(err){
      notification.warn('Error unarchiving ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerError('Error unarchiving asset', err);
    });
  };

  $scope.unpublish = function () {
    $scope.asset.unpublish()
    .then(function(){
      notification.info(title() + ' unpublished successfully');
      $scope.otUpdateEntity();
    })
    .catch(function(err){
      notification.warn('Error unpublishing ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerError('Error unpublishing asset', err);
    });
  };

  $scope.publish = function () {
    var version = $scope.asset.getVersion();
    if (!$scope.validate()) {
      notification.warn('Error publishing ' + title() + ': ' + 'Validation failed');
      return;
    }
    $scope.asset.publish(version)
    .then(function(){
      $scope.asset.setPublishedVersion(version);
      notification.info(title() + ' published successfully');
    })
    .catch(function(err){
      var errorId = dotty.get(err, 'body.sys.id');
      if (errorId === 'ValidationFailed') {
        $scope.setValidationErrors(dotty.get(err, 'body.details.errors'));
        notification.warn('Error publishing ' + title() + ': Validation failed');
      } else if (errorId === 'VersionMismatch'){
        notification.warn('Error publishing ' + title() + ': Can only publish most recent version');
      } else {
        notification.serverError('Error publishing asset: ' + errorId, err);
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

