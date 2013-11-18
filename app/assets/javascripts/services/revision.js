'use strict';
angular.module('contentful').factory('revision', function RevisionFactory($rootScope, $http, $q, environment) {
  return {
    hasNewVersion: function() {
      return $http.get('/manifest.json?cfv='+Math.ceil(Math.random()*10000000)).
      then(function (response) {
        if(response && response.data && response.data.git_revision !== environment.settings.git_revision){
          return $q.reject('App revision has changed');
        }
      });
    }
  };
});
