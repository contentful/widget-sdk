'use strict';

var NullPlayer = {
  play: function(params){
   this.pending = params;
  }
};

angular.module('contentful').directive('cfYoutubePlayer', ['youtubePlayerLoader', function(youtubePlayerLoader){
  var YOUTUBE_DOM_ELEMENT_ID = 'youtube-player';

  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_youtube_player'](),

    link: function(scope) {
      scope.player = NullPlayer;

      youtubePlayerLoader.player().then(function(player){
        var nullPlayer = scope.player;

        scope.player = player;
        scope.player
          .install(YOUTUBE_DOM_ELEMENT_ID)
          .then(function(player){
            if (nullPlayer.pending) player.play(nullPlayer.pending);
          });

      });
    },

    controller: ['$scope', function($scope){
      $scope.$watch('videoURL', function(newVal, oldVal){
        if (newVal === oldVal) return;

        $scope.player.play({videoId: $scope.videoURL});
      });
    }]
  };
}]);
