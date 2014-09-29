'use strict';
angular.module('contentful').factory('youtubePlayerLoader', ['$injector', function($injector){

  var YoutubePlayerAdapter = $injector.get('YoutubePlayerAdapter');
  var googleScriptLoader   = $injector.get('googleScriptLoader');

  var SCRIPT_SRC = "https://www.youtube.com/iframe_api";

  return {
    load : function(){
      return googleScriptLoader.load(SCRIPT_SRC, {name: 'onYouTubeIframeAPIReady'})
      .then(function(){
        return new YoutubePlayerAdapter(YT.Player);
      });
    }
  };
}]);
