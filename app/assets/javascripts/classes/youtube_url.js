'use strict';
angular.module('contentful').factory('YoutubeUrl', [function(){
  var YOUTUBE_URL_REGEXP = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

  function YoutubeUrl(url){
    this.url = url;
  }

  YoutubeUrl.prototype = {
    isValid: function(){
      return this.videoId() != null;
    },

    videoId: function(){
      var match = this.url.match(YOUTUBE_URL_REGEXP);
      return match && match[1];
    }
  };

  return YoutubeUrl;
}]);
