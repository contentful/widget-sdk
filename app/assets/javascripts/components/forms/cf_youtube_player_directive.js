'use strict';

angular.module('contentful').directive('cfYoutubePlayer', ['youtubePlayerLoader', function(youtubePlayerLoader){
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
            player.play({videoId: scope.videoURL});
          });

      });
    },

    controller: ['$scope', function($scope){
      $scope.$watch('videoURL', function(newVal, oldVal){
        if (newVal === oldVal || !$scope.player) return;

        $scope.player.play({videoId: $scope.videoURL});
      });
    }]
  };
}]);
