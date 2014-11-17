'use strict';

angular.module('contentful').controller('cfOoyalaSearchResultController', ['$scope', function($scope){

  $scope.showPlayer      = false;
  $scope.isPlayerLoading = false;

  $scope.$watch('playerId', updatePlayerId);

  $scope.handlePlayerReady = handlePlayerReady;
  $scope.formattedDuration = formatVideoDuration('%h:%m:%s');

  this.pauseVideo = pauseVideo;
  this.playVideo  = playVideo;

  function pauseVideo() {
    $scope.isPlaying = false;
    $scope.ooyalaPlayerController().pause();
  }

  function playVideo() {
    if( !$scope.playerId ) {
      $scope.playerId    = $scope.video.playerId;
      $scope.assetId     = $scope.video.id;
      $scope.isPlayerLoading = true;
    } else {
      $scope.ooyalaPlayerController().play();
    }

    $scope.showPreview = false;
    $scope.isPlaying = true;
  }

  function updatePlayerId(playerId) {
    if (!playerId)  $scope.showPlayer = false;
  }

  function handlePlayerReady() {
    $scope.isPlayerLoading = false;
    $scope.showPlayer = true;
  }

  function formatVideoDuration(format) {
    var duration = moment.duration($scope.video.duration);

    function pad(number) {
      return number < 10 ? '0' + number : number;
    }

    return  format
            .replace('%h', pad(duration.hours()))
            .replace('%m', pad(duration.minutes()))
            .replace('%s', pad(duration.seconds()));
  }
}]);
