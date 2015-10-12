'use strict';
angular.module('contentful')
.controller('AssetActionsController',
['$scope', '$injector', function AssetActionsController($scope, $injector) {
  var controller = this;

  var Command    = $injector.get('command');
  var $rootScope = $injector.get('$rootScope');
  var $q         = $injector.get('$q');
  var notifier   = $injector.get('assetEditor/notifications');


  var notify = notifier(function () {
    return '“' + $scope.title + '”';
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

}]);
