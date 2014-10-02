'use strict';

angular.module('contentful').controller('cfYoutubeEditorController', ['$injector', '$scope', function($injector, $scope){
  var YoutubeUrl = $injector.get('YoutubeUrl');

  $scope.$watch('url', updateYoutubeUrl);

  $scope.isPlayerLoading            = false;
  $scope.isPlayerReady              = false;
  $scope.hasPlayerFailedToLoad      = false;
  $scope.hasPlayerFailedToLoadVideo = false;

  $scope.handlePlayerFailure           = handlePlayerFailure;
  $scope.handlePlayerReady             = handlePlayerReady;
  $scope.handlePlayerFailedToLoadVideo = handlePlayerFailedToLoadVideo;
  $scope.handlePlayerReadyToPlayVideo  = handlePlayerReadyToPlayVideo;
  $scope.handleClickOnRemoveSign       = handleClickOnRemoveSign;

  function handlePlayerFailure() {
    $scope.isPlayerLoading       = false;
    $scope.hasPlayerFailedToLoad = true;
  }

  function handlePlayerReady() {
    $scope.isPlayerReady = true;
  }

  function handlePlayerReadyToPlayVideo() {
    $scope.isPlayerLoading = false;
  }

  function handlePlayerFailedToLoadVideo() {
    $scope.isPlayerLoading            = false;
    $scope.hasPlayerFailedToLoadVideo = true;
  }

  function updateYoutubeUrl(newVal, oldVal) {
    if (newVal == oldVal || newVal === null) return;

    $scope.isPlayerLoading            = true;
    $scope.hasPlayerFailedToLoad      = false;
    $scope.hasPlayerFailedToLoadVideo = false;
    $scope.youtubeUrl                 = new YoutubeUrl($scope.url);

    $scope.otBindInternalChangeHandler();
  }

  function handleClickOnRemoveSign() {
    $scope.url = null;
  }

}]);
