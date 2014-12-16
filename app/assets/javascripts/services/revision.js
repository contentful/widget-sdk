'use strict';
angular.module('contentful').factory('revision', ['$rootScope', '$http', '$q', 'environment', 'logger', function RevisionFactory($rootScope, $http, $q, environment, logger) {
  function hideManifestErrors(response, getHeader) {
    if(getHeader('Content-Type') === 'application/json' && _.isString(response)){
      try {
        JSON.parse(response);
        return response;
      } catch(err){
        logger.logError('Failure to parse manifest.json', {
          data: {
            err: err
          }
        });
      }
    }
    return response;
  }

  return {
    hasNewVersion: function() {
      $http.defaults.transformResponse.unshift(hideManifestErrors);

      return $http.get('/revision.json?cfv='+Math.ceil(Math.random()*10000000)).
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
}]);
