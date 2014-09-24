'use strict';
angular.module('contentful').factory('YoutubePlayerAdapter', ['$q', function($q){
  function YoutubePlayerAdapter(YoutubePlayer){
    this.YoutubePlayer = YoutubePlayer;
  }

  YoutubePlayerAdapter.prototype = {
    install: function(el, delegate){
      var defer = $q.defer();


      if (!this._isPlayerInstalled()) {
        this.delegate = delegate;
        this._installPlayer(el, defer);
      } else
        defer.resolve(this);

      return defer.promise;
    },

    play: function(params, delegator){
      if (!this._isPlayerInstalled()) return;

      console.log('play video', params.videoId);

      function extractVideoIdFromUrl(url){
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        return match && match[2];
      }

      this.player.cueVideoById(extractVideoIdFromUrl(params.videoId));
    },

    _installPlayer: function(el, defer){
      var self = this;

      new this.YoutubePlayer(el, {
        events: {
          'onError': function(){
            self.delegate.handlePlayerFailedToLoadVideo();
          },
          'onStateChange': function(event){
            if (event.data == YT.PlayerState.UNSTARTED)
              self.delegate.handlePlayerReadyToPlayVideo();
          },
          'onReady': function(event){
            self.delegate.handlePlayerReady();
            self.player = event.target;
            defer.resolve(self);
          }
        }
      });
    },

    _isPlayerInstalled: function(){
      return this.player !== undefined;
    }
  };

  return YoutubePlayerAdapter;
}]);
