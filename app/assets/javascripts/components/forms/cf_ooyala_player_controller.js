'use strict';

angular.module('contentful').controller('cfOoyalaPlayerController', ['$scope', function($scope){
  $scope.$on('player:ready', handlePlayerReady);

  function handlePlayerReady(e, data) {
    $scope.title         = data.title;
  }
}]);
