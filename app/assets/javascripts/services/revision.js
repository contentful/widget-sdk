'use strict';
/*
angular.module('contentful').factory('revision', function RevisionFactory() {
  return {};
  /*
  return {
    hasNewVersion: function() {
      var deferred = $q.defer();

      $http.get('/manifest.json').
      success(function (data) {
        if(data.git_revision !== environment.settings.git_revision)
          deferred.resolve();
        else
          deferred.reject();
      }).
      error(function () {
        deferred.reject();
      });

      return deferred.promise;
    }
  };
});
*/
angular.module('contentful').factory('revision', function(){
});
