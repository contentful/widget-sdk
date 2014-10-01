'use strict';

angular.module('contentful').controller('cfYoutubeEditorController', ['$injector', '$scope', function($injector, $scope){
  var YoutubeUrl = $injector.get('YoutubeUrl');

  $scope.$watch('url', updateYoutubeUrl);

  $scope.isPlayerLoading = false;

  $scope.handlePlayerFailedToLoadVideo = handlePlayerFailedToLoadVideo;
  $scope.handlePlayerReadyToPlayVideo  = handlePlayerReadyToPlayVideo;
  $scope.handleClickOnRemoveSign       = handleClickOnRemoveSign;

  function handlePlayerReadyToPlayVideo() {
    $scope.isPlayerLoading = false;
  }

  function handlePlayerFailedToLoadVideo() {
    $scope.isPlayerLoading = false;
  }

  function updateYoutubeUrl(newVal, oldVal) {
    if (newVal == oldVal || newVal === null) return;

    $scope.isPlayerLoading = true;
    $scope.youtubeUrl      = new YoutubeUrl($scope.url);

    $scope.otBindInternalChangeHandler();
  }

  function handleClickOnRemoveSign() {
    $scope.url = null;
  }

}]);
