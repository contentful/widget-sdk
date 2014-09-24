'use strict';

var Player = function(YoutubePlayer, element){
  this.YoutubePlayer = YoutubePlayer;
  this.element       = element;
};

Player.prototype.reset = function(){
  angular.element('#youtube-player').replaceWith('<div id="youtube-player"></div>');
  return this;
};

Player.prototype.load = function(videoId, options) {
  var p  = new this.YoutubePlayer(this.element, {
      height: '390',
      width: '640',
      videoId: videoId,
      events: {
        'onReady' : function(){
          console.log("READYYYYYYYYYYYYYYY");
        },
        'onStateChange' : function(state){
          console.log("STATE CHANGEEEEEEE ", state);
          if (state == -1) { //magic numbers ugh
            options.ready();
          }
        },
        'onError' : function(){
          console.log("///////////////////////////////////////////")
          options.error();
        }
      }
    }
   );
   p.addEventListener("onError", function(){console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")});

   return p;
};

angular.module('contentful').directive('cfYoutubeEditor', ['youtubePlayer', function(youtubePlayer){
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_youtube_editor'](),
    link: function(scope, elem) {
      youtubePlayer.player().then(function(player){
        scope.player = new Player(player, 'youtube-player');
      });
    },
    controller: ['$scope', function($scope){
      $scope.handleChange = _.debounce(handleInputChange, 250, {maxWait: 750});

      function handleInputChange(){
        console.log("CHANGE");

        if ($scope.player){
          console.log($scope.url);
          $scope.player.reset().load($scope.url, {
            ready: handleVideoPlayerReady,
            error: handleVideoPlayerError
          });
        }
      }

      function handleVideoPlayerReady(){
        console.log("READY");
      }

      function handleVideoPlayerError(){
        console.log("ERROR");
      }
    }],

  };
}]);
