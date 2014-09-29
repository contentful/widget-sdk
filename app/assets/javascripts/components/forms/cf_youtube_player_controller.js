'use strict';

angular.module('contentful').controller('cfYoutubePlayerController', ['$injector', '$scope', function($injector, $scope){

  var youtubeGAPIAdapter     = $injector.get('youtubeGAPIAdapter');
  var youtubePlayerLoader    = $injector.get('youtubePlayerLoader');

  var YOUTUBE_DOM_ELEMENT_ID = 'youtube-player';

  youtubePlayerLoader.load().then(function(player){
    $scope.player = player;
    $scope.player
      .install(YOUTUBE_DOM_ELEMENT_ID, $scope.youtubePlayerDelegate)
      .then(updateYoutubePlayer);
  });

  $scope.$watch('youtubeUrl', handleUpdateInYoutubeUrl);

  function handleUpdateInYoutubeUrl(newVal, oldVal) {
    if (newVal === oldVal || !$scope.player) return;

    updateYoutubePlayer($scope.player);
  }

  function updateYoutubePlayer(player){
    youtubeGAPIAdapter.videoInfo($scope.youtubeUrl.videoId()).then(updateVideoInfo);
    $scope.player.play({videoId: $scope.youtubeUrl.videoId()});
  }

  function updateVideoInfo(info){
    $scope.title = info.title;
  }

}]);

