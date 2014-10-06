'use strict';
angular.module('contentful').factory('youtubePlayerLoader', ['$injector', function($injector){
  var $window            = $injector.get('$window');
  var googleScriptLoader = $injector.get('googleScriptLoader');

  var SCRIPT_SRC = 'https://www.youtube.com/iframe_api';

  return {
    load : function(){
      return googleScriptLoader.load(SCRIPT_SRC, {name: 'onYouTubeIframeAPIReady'})
      .then(function(){
        return $window.YT.Player;
      });
    }
  };
}]);
