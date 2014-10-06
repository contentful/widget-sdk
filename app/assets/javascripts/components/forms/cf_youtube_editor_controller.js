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

  function updateYoutubeUrl(url) {
    if (_.isEmpty(url)){
      $scope.isPlayerLoading = false;
    } else {
      $scope.isPlayerLoading = true;
      $scope.youtubeUrl      = new YoutubeUrl(url);
    }

    $scope.hasPlayerFailedToLoad      = false;
    $scope.hasPlayerFailedToLoadVideo = false;
    $scope.otBindInternalChangeHandler();
  }

  function handleClickOnRemoveSign() {
    $scope.url = '';
  }

}]);
