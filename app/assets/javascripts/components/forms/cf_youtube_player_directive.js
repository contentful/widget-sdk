'use strict';
var NullPlayer = { install: function(){}, play: function(){} };

angular.module('contentful').directive('cfYoutubePlayer', ['youtubePlayerLoader', function(youtubePlayerLoader){
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_youtube_player'](),

    link: function(scope, elem) {
      scope.player = NullPlayer;
      youtubePlayerLoader.player().then(function(player){
        scope.player = player;

        console.log(scope.videoURL);
        if (scope.videoURL){
          console.log('play now')
          var delegator = {
            handlePlayerError: function(){
              console.log("Error playing video");
            }
          };

          scope.player
            .install('youtube-player')
            .then(function(player){
              player.play({
                el: 'youtube-player',
                width: 640,
                height: 390,
                videoId: scope.videoURL
              }, delegator);
            });
        }
      });
    },

    controller: ['$scope', function($scope){
      var delegator = {
        handlePlayerError: function(){
          console.log("Error playing video");
        }
      };

      $scope.$watch('videoURL', function(newVal, oldVal){
        console.log("newVal ", newVal, " oldVal ", oldVal);
        if (newVal === oldVal) return;

        console.log('change in the video url');
        $scope.player
          .install('youtube-player')
          .then(function(player){
            player.play({
              el: 'youtube-player',
              width: 640,
              height: 390,
              videoId: $scope.videoURL
            }, delegator);
          });
      });
    }]
  };
}]);
