'use strict';
angular.module('contentful').factory('youtubeGAPIAdapter', ['$injector', function($injector){
  var gapiLoader = $injector.get('gapiLoader');

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
        return gapi.request(params).then(function(items){
          if (items[0]){
            return {title: items[0].snippet.title};
          } else {
            return {title : undefined};
          }
        });
      });
    }
  };
}]);


