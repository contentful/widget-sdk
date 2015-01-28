'use strict';

angular.module('contentful').controller('cfVideoPlayerController', ['$scope', function($scope){

  this.play  = play;
  this.pause = pause;

  function play() {
    $scope.videoPlayer.play();
  }

  function pause() {
    $scope.videoPlayer.pause();
  }
}]);
