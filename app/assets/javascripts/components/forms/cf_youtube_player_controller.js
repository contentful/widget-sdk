'use strict';

angular.module('contentful').controller('cfYoutubePlayerController', ['$injector', '$scope', function($injector, $scope){

  var youtubeGAPIAdapter     = $injector.get('youtubeGAPIAdapter');

  $scope.$watch('youtubeUrl', handleUpdateInYoutubeUrl);
  $scope.handlePlayerInstalled = handlePlayerInstalled;

  function handlePlayerInstalled(e) {
    if ($scope.youtubeUrl) updateYoutubePlayer();
  }

  function handleUpdateInYoutubeUrl(newVal, oldVal) {
    if (newVal === oldVal || !$scope.player) return;

    updateYoutubePlayer();
  }

  function updateYoutubePlayer(){
    youtubeGAPIAdapter.videoInfo($scope.youtubeUrl.videoId()).then(updateVideoInfo);
    $scope.player.cueVideoById($scope.youtubeUrl.videoId());
  }

  function updateVideoInfo(info){
    $scope.title = info.title;
  }

}]);

