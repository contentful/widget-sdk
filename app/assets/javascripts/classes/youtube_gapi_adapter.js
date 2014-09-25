'use strict';
angular.module('contentful').factory('youtubeGAPIAdapter', ['$q', 'gapiLoader', function($q, gapiLoader){
  return {
    videoInfo: function(videoId){
      var params = {
        path: 'youtube/v3/videos',
        params: {
          part: ['snippet', 'statistics'],
          id: [videoId]
        }
      };

      return gapiLoader.load().then(function(gapi){
        return gapi.request(params);
      });
    }
  };
}]);


