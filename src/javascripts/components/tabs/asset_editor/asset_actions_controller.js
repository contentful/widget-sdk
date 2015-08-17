'use strict';
angular.module('contentful')
.controller('AssetActionsController',
['$scope', '$injector', function AssetActionsController($scope, $injector) {
  var controller = this;

  var Command      = $injector.get('command');
  var logger       = $injector.get('logger');
  var notification = $injector.get('notification');
  var $rootScope   = $injector.get('$rootScope');
  var $q           = $injector.get('$q');
  var truncate     = $injector.get('stringUtils').truncate;


  // TODO If we are sure that the data in the asset has been updated from the ShareJS doc,
  // We can query the asset instead of reimplementing the checks heere
  function title() {
    return '“' + truncate($scope.spaceContext.assetTitle($scope.asset), 50) + '”';
  }


  function createAssetCommand (action, run, extension) {
    var can = function () {
      return $scope.entityActionsController.can(action);
    };

    controller[action] = Command.create(run, {available: can}, extension);
  }

  createAssetCommand('delete', function () {
    return $scope.asset.delete()
    .then(function(asset){
      notification.info('Asset deleted successfully');
      $rootScope.$broadcast('entityDeleted', asset);
    })
    .catch(function(err){
      notification.error('Error deleting Asset');
      logger.logServerWarn('Error deleting Asset', {error: err });
    });
  });

  createAssetCommand('archive', function () {
    return $scope.asset.archive()
    .then(function(){
      notification.info(title() + ' archived successfully');
    })
    .catch(function(err){
      notification.warn('Error archiving ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerWarn('Error archiving asset', {error: err });
    });
  });

  createAssetCommand('unarchive', function () {
    return $scope.asset.unarchive()
    .then(function(){
      notification.info(title() + ' unarchived successfully');
    })
    .catch(function(err){
      notification.warn('Error unarchiving ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerWarn('Error unarchiving asset', {error: err });
    });
  });

  createAssetCommand('unpublish', function () {
    return $scope.asset.unpublish()
    .then(function(){
      notification.info(title() + ' unpublished successfully');
      $scope.otUpdateEntity();
    })
    .catch(function(err){
      notification.warn('Error unpublishing ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerWarn('Error unpublishing asset', {error: err });
    });
  });

  createAssetCommand('publish', publish, {
    label: getPublishCommandLabel
  });

  function publish () {
    var version = $scope.asset.getVersion();
    if (!$scope.validate()) {
      notification.warn('Error publishing ' + title() + ': ' + 'Validation failed');
      return $q.reject();
    }
    return $scope.asset.publish(version)
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
        notification.error('Publishing the asset has failed due to a server issue. We have been notified.');
        logger.logServerWarn('Publishing the asset has failed due to a server issue. We have been notified.', {error: err });
      }
    });
  }

  function getPublishCommandLabel () {
    var isPublished = !!$scope.asset.getPublishedAt();
    if (isPublished) {
      return 'Republish';
    } else {
      return 'Publish';
    }
  }
}]);

