'use strict';

angular.module('contentful').controller('cfOoyalaPlayerController', ['$scope', function($scope){
  $scope.$on('player:loaded', startWatching);
  $scope.$on('player:ready', handlePlayerReady);

  $scope.isPlayerReady = false;

  function handlePlayerReady(e, data) {
    $scope.title         = data.title;
    $scope.isPlayerReady = true;
  }

  function startWatching() {
    $scope.$watch('assetId', watchAssetId);
  }

  function watchAssetId(newAssetId) {
    $scope.createPlayer(newAssetId);
  }

}]);

