'use strict';

angular.module('contentful').controller('cfOoyalaMultiAssetItemController', ['$scope', '$injector', function($scope, $injector){
  var ooyalaClient = $injector.get('ooyalaClient');

  ooyalaClient.setOrganizationId($scope.spaceContext.space.getOrganizationId());

  $scope.$watch('asset.assetId', fetchAssetInfo);

  $scope.isPlayerReady = false;

  this.notifyPlayerIsReady = notifyPlayerIsReady;

  function fetchAssetInfo() {
    ooyalaClient.asset($scope.asset.assetId)
      .then(setAssetInfo)
      .catch(showError);
  }

  function setAssetInfo(response) {
    $scope.asset.title    = response.name;
    $scope.asset.playerId = response.player_id;
  }

  function showError(error) {
    $scope.error = error.message;
  }

  function notifyPlayerIsReady() {
    $scope.isPlayerReady = true;
  }

}]);
