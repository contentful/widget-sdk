'use strict';
angular.module('contentful')
.controller('AssetActionsController',
['$scope', '$injector', function AssetActionsController($scope, $injector) {
  var controller = this;

  var Command    = $injector.get('command');
  var $rootScope = $injector.get('$rootScope');
  var $q         = $injector.get('$q');
  var truncate   = $injector.get('stringUtils').truncate;
  var notifier   = $injector.get('assetEditor/notifications');


  var notify = notifier(function () {
    return '“' + truncate($scope.spaceContext.assetTitle($scope.asset), 50) + '”';
  });


  function createAssetCommand (action, run, extension) {
    var can = function () {
      return $scope.entityActionsController.can(action);
    };

    controller[action] = Command.create(run, {available: can}, extension);
  }

  createAssetCommand('delete', function () {
    return $scope.asset.delete()
    .then(function(asset){
      notify.deleteSuccess();
      $rootScope.$broadcast('entityDeleted', asset);
    })
    .catch(notify.deleteFail);
  });

  createAssetCommand('archive', function () {
    return $scope.asset.archive()
    .then(notify.archiveSuccess, notify.archiveFail);
  });

  createAssetCommand('unarchive', function () {
    return $scope.asset.unarchive()
    .then(notify.unarchiveSuccess, notify.unarchiveFail);
  });

  createAssetCommand('unpublish', function () {
    return $scope.asset.unpublish()
    .then(function(){
      notify.unpublishSuccess();
      $scope.otDoc.updateEntityData();
    })
    .catch(notify.unpublishFail);
  });


  createAssetCommand('publish', function () {
    if (!$scope.validate()) {
      notify.publishValidationFail();
      return $q.reject();
    }
    return $scope.asset.publish()
    .then(notify.publishSuccess, function(error){
      var errorId = dotty.get(error, 'body.sys.id');
      if (errorId === 'ValidationFailed') {
        $scope.setValidationErrors(dotty.get(error, 'body.details.errors'));
        notify.publishValidationFail();
      } else if (errorId === 'VersionMismatch'){
        notify.publishFail('Can only publish most recent version');
      } else {
        notify.publishServerFail(error);
      }
    });
  }, {
    label: getPublishCommandLabel
  });

  function getPublishCommandLabel () {
    var isPublished = !!$scope.asset.getPublishedAt();
    if (isPublished) {
      return 'Republish';
    } else {
      return 'Publish';
    }
  }

}])

.factory('assetEditor/notifications', ['$injector', function ($injector) {
  var logger       = $injector.get('logger');
  var notification = $injector.get('notification');

  return function (getTitle) {
    return {
      deleteSuccess: function () {
        notification.info('Asset deleted successfully');
      },

      deleteFail: function (error) {
        notification.error('Error deleting Asset');
        logger.logServerWarn('Error deleting Asset', {error: error });
      },

      archiveSuccess: function () {
        notification.info(getTitle() + ' archived successfully');
      },

      archiveFail: function (error) {
        notification.error('Error archiving ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error archiving asset', {error: error });
      },

      unarchiveSuccess: function () {
        notification.info(getTitle() + ' unarchived successfully');
      },

      unarchiveFail: function (error) {
        notification.error('Error unarchiving ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error unarchiving asset', {error: error });
      },

      unpublishSuccess: function () {
        notification.info(getTitle() + ' unpublished successfully');
      },

      unpublishFail: function (error) {
        notification.error('Error unpublishing ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error unpublishing asset', {error: error });
      },

      publishSuccess: function () {
        notification.info(getTitle() + ' published successfully');
      },

      publishServerFail: function (error) {
        notification.error('Publishing the asset has failed due to a server issue. We have been notified.');
        logger.logServerWarn('Publishing the asset has failed due to a server issue. We have been notified.', {error: error });
      },

      publishFail: function (message) {
        notification.error('Error publishing ' + getTitle() + ': ' + message);
      },

      publishValidationFail: function () {
        notification.error('Error publishing ' + getTitle() + ': ' + 'Validation failed. ' +
                           'Please check the individual fields for errors.');
      }
    };
  };
}]);
