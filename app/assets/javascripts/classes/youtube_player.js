'use strict';
angular.module('contentful').factory('YoutubePlayerAdapter', [function(){
  function YoutubePlayerAdapter(player){
    this.player = player;
  }

  YoutubePlayerAdapter.prototype = {
    play: function(params, delegator){
      new this.player(params.el, {
        width: params.width,
        height: params.height,
        videoId: params.videoId,
        events: {
          'onError': delegator.handlePlayerError,
        }
      });
    }
  };

  return YoutubePlayerAdapter;
}]);
