'use strict';

angular.module('contentful').controller('cfOoyalaPlayerController', ['$scope', function($scope){
  $scope.$on('player:ready', handlePlayerReady);

  this.pause = pause;
  this.play  = play;

  function pause() {
    $scope.pause();
  }

  function play() {
    $scope.play();
  }

  function handlePlayerReady(e, data) {
    $scope.title         = data.title;
  }
}]);
