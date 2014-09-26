'use strict';

angular.module('contentful').directive('cfYoutubePlayer', [
  'youtubePlayerLoader', 'youtubeGAPIAdapter', function(youtubePlayerLoader, youtubeGAPIAdapter){
  var YOUTUBE_DOM_ELEMENT_ID = 'youtube-player';

  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_youtube_player'](),

    link: function(scope) {

      youtubePlayerLoader.player().then(function(player){
        scope.player = player;
        scope.player
          .install(YOUTUBE_DOM_ELEMENT_ID, scope.youtubePlayerDelegate)
          .then(function(player){
            youtubeGAPIAdapter.videoInfo(scope.youtubeUrl.videoId()).then(function(items){
              scope.title = items[0].snippet.title;
            });
            player.play({videoId: scope.youtubeUrl.videoId()});
          });

      });
    },

    controller: ['$scope', function($scope){
      $scope.$watch('youtubeUrl', function(newVal, oldVal){
        if (newVal === oldVal || !$scope.player) return;

        youtubeGAPIAdapter.videoInfo($scope.youtubeUrl.videoId()).then(function(items){
          $scope.title = items[0].snippet.title;
        });

        $scope.player.play({videoId: $scope.youtubeUrl.videoId()});

      });
    }]
  };
}]);
