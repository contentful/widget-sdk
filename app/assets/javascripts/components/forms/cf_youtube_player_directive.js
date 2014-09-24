'use strict';
var NullPlayer = { play: function(){} };

angular.module('contentful').directive('cfYoutubePlayer', ['youtubePlayer', function(youtubePlayer){
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_youtube_player'](),

    link: function(scope, elem) {
      scope.player = NullPlayer;
      youtubePlayer.player().then(function(player){
        scope.player = player;
      });
    },

    controller: ['$scope', function($scope){
      var delegator = {
        handlePlayerError: function(){
          console.log("Error playing video");
        }
      };

      $scope.$watch('videoURL', function(newVal, oldVal){
        if (newVal === oldVal) return;

        console.log('change in the video url');
        $scope.player.play({
            el: 'youtube-player',
            width: 640,
            height: 390,
            videoId: $scope.videoURL
          }, delegator
        );
      });
    }]
  };
}]);
