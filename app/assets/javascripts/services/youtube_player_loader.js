'use strict';
angular.module('contentful').factory('youtubePlayerLoader', ['$injector', function($injector){

  var YoutubePlayerAdapter = $injector.get('YoutubePlayerAdapter');
  var $q                   = $injector.get('$q');

  var deferreds = [];
  var loaded;
  var loading   = false;

  window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

  // Global function expected by YouTube iframe player
  function onYouTubeIframeAPIReady() {
    loaded = true;
    _.each(deferreds, function(defer){ defer.resolve(new YoutubePlayerAdapter(YT.Player)); });
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

      loaded ? defer.resolve(new YoutubePlayerAdapter(YT.Player)) : deferreds.push(defer);

      if (!loading) loadPlayer();

      return defer.promise;
    }
  };
}]);
