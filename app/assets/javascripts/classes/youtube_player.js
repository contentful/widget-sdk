'use strict';
angular.module('contentful').factory('YoutubePlayerAdapter', ['$q', function($q){
  function YoutubePlayerAdapter(YoutubePlayer){
    this.YoutubePlayer = YoutubePlayer;
    this.installed = false;
  }

  YoutubePlayerAdapter.prototype = {
    install: function(el){
      var defer = $q.defer(),
          self  = this;

      if (!this.installed) {
        this.player = new this.YoutubePlayer(el, {
          events: {
            'onError': function(){
              console.log(arguments)

            },
            'onReady': function(){
              self.installed = true;
              defer.resolve(self);
            }
          }
        });
      } else
        defer.resolve(this);

      return defer.promise;
    },

    play: function(params, delegator){
      console.log('play video', params.videoId);

      function extractVideoIdFromUrl(url){
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        return match && match[2];
      }

      this.player.loadVideoById(extractVideoIdFromUrl(params.videoId));
    }
  };

  return YoutubePlayerAdapter;
}]);
