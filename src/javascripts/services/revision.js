'use strict';
angular.module('contentful')
.factory('revision', ['$injector', function($injector) {
  var logger = $injector.get('logger');
  var $http = $injector.get('$http');
  var environment = $injector.get('environment');

  return {
    hasNewVersion: function() {
      var transformResponse = $http.defaults.transformResponse.slice();
      transformResponse.unshift(hideManifestErrors);

      var random = Math.ceil(Math.random()*10000000);

      return $http.get('/revision.json?cfv='+random, {
        transformResponse: transformResponse,
      }).then(function (response) {
        return response && response.data &&
               response.data.git_revision &&
               response.data.git_revision !== environment.gitRevision;
      });
    }
  };

  function hideManifestErrors(response, getHeader) {
    if(getHeader('Content-Type') === 'application/json' && _.isString(response)){
      try {
        JSON.parse(response);
        return response;
      } catch(err){
        logger.logError('Failure to parse revision.json', { error: err });
      }
    }
    return response;
  }
}]);
