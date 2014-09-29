'use strict';
angular.module('contentful').factory('YoutubePlayerAdapter', ['$injector', function($injector){

  var $q = $injector.get('$q');

  function YoutubePlayerAdapter(YoutubePlayer){
    this.YoutubePlayer = YoutubePlayer;
  }

  YoutubePlayerAdapter.prototype = {
    install: function(el, delegate){
      this.delegate = delegate;
      return this._installPlayer(el);
    },

    play: function(params, delegator){
      this.player.cueVideoById(params.videoId);
    },

    _installPlayer: function(el){
      var self  = this,
          defer = $q.defer();

      new this.YoutubePlayer(el, {
        width: '100%',
        events: {
          'onError': function(){
            self.delegate.handlePlayerFailedToLoadVideo();
          },
          'onStateChange': function(event){
            if (event.data == YT.PlayerState.CUED)
              self.delegate.handlePlayerReadyToPlayVideo();
          },
          'onReady': function(event){
            self.delegate.handlePlayerReady();
            self.player = event.target;
            defer.resolve(self);
          }
        }
      });

      return defer.promise;
    }

  };

  return YoutubePlayerAdapter;
}]);
