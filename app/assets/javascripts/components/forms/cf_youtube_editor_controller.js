'use strict';

angular.module('contentful').controller('cfYoutubeEditorController', ['$injector', '$scope', function($injector, $scope){
  var YoutubeUrl       = $injector.get('YoutubeUrl');

  $scope.$watch('url', updateYoutubeUrl);

  $scope.isPlayerLoading = false;
  $scope.isPlayerReady   = false;
  $scope.errorMessage    = undefined;

  $scope.handlePlayerFailure           = handlePlayerFailure;
  $scope.handlePlayerReady             = handlePlayerReady;
  $scope.handlePlayerFailedToLoadVideo = handlePlayerFailedToLoadVideo;
  $scope.handlePlayerReadyToPlayVideo  = handlePlayerReadyToPlayVideo;
  $scope.handleClickOnRemoveSign       = handleClickOnRemoveSign;

  function handlePlayerFailure() {
    $scope.isPlayerLoading       = false;
    $scope.errorMessage = 'Can not load the Youtube player. Try reloading the application';
  }

  function handlePlayerReady() {
    $scope.isPlayerReady = true;
  }

  function handlePlayerReadyToPlayVideo() {
    $scope.isPlayerLoading = false;
  }

  function handlePlayerFailedToLoadVideo() {
    $scope.isPlayerLoading            = false;
    $scope.errorMessage = 'Can not load the video. Please check the url';
  }

  function updateYoutubeUrl(url) {
    if (_.isEmpty(url)){
      $scope.isPlayerLoading = false;
    } else {
      $scope.isPlayerLoading = true;
      $scope.youtubeUrl      = new YoutubeUrl(url);
    }

    $scope.errorMessage = '';
    $scope.otBindInternalChangeHandler();
  }

  function handleClickOnRemoveSign() {
    $scope.url = '';
  }

}]);
