'use strict';
angular.module('contentful').factory('revision', function RevisionFactory($rootScope, $http, $q, environment, sentry) {
  function hideManifestErrors(response, getHeader) {
    if(getHeader('Content-Type') === 'application/json'){
      try {
        JSON.parse(response);
        return response;
      } catch(err){
        sentry.captureError('Failure to parse manifest.json', {
          data: {
            err: err
          }
        });
      }
    }
  }

  return {
    hasNewVersion: function() {
      $http.defaults.transformResponse.unshift(hideManifestErrors);

      return $http.get('/manifest.json?cfv='+Math.ceil(Math.random()*10000000)).
      then(function (response) {
        if(response && response.data &&
           response.data.git_revision &&
           response.data.git_revision !== environment.settings.git_revision){
          return $q.reject('APP_REVISION_CHANGED');
        }
      }).
      finally(function () {
        $http.defaults.transformResponse.shift();
      });
    }
  };
});
