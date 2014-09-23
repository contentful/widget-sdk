'use strict';
angular.module('contentful').factory('youtubePlayer', ['$q', function($q){
  var player,
      loading   = false,
      deferreds = [];

  window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

  function onYouTubeIframeAPIReady() {
    player = YT.Player;

    _.each(deferreds, function(defer){ defer.resolve(player); });
  }

  function loadPlayer() {
    loading = true;
    var tag            = document.createElement('script'),
        firstScriptTag = document.getElementsByTagName('script')[0];

    tag.src = "https://www.youtube.com/iframe_api";
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  return {
    player : function(){
      var defer = $q.defer();

      player ? defer.resolve(player) : deferreds.push(defer);

      if (!loading) loadPlayer();

      return defer.promise;
    }
  };
}]);
