'use strict';

angular.module('contentful').controller('cfOoyalaSearchResultController', ['$scope', function($scope){

  $scope.showPlayer = false;

  $scope.handlePlayerReady = handlePlayerReady;

  $scope.$watch('playerId', updatePlayerId);

  $scope.formattedDuration = formatVideoDuration('%h:%m:%s');

  function updatePlayerId(playerId) {
    if (!playerId)  $scope.showPlayer = false;
  }

  function handlePlayerReady() {
    $scope.hideFeedbackInfo();
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
