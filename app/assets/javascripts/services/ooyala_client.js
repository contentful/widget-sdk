'use strict';

angular.module('contentful').factory('ooyalaClient', ['$injector', function($injector){
  var $q = $injector.get('$q');

  function OoyalaClient(){
    this.clientAdapter = $injector.get('clientAdapter');
  }

  OoyalaClient.prototype = {
    errorCodes: {
      INVALID_ASSET_ID: 1,
      MISSING_CREDENTIALS: 2
    },

    request: function(organizationId, method, endpoint, payload) {
      return this.clientAdapter.request({
        method   : method,
        endpoint : endpoint,
        payload  : payload,
        headers: {
          'X-Contentful-Organization' : organizationId
        }
      }).catch(function(response){
        if (
          response.statusCode == 403 &&
          response.body && response.body.message &&
          response.body.message == 'Missing credentials'
        )
          return $q.reject({response: response, code: OoyalaClient.prototype.errorCodes.MISSING_CREDENTIALS});

        if (response.statusCode == 404)
          return $q.reject({response: response, code: OoyalaClient.prototype.errorCodes.INVALID_ASSET_ID});

        return $q.reject(response);
      });
    },

    asset: function(organizationId, assetId) {
      return this.request(organizationId, 'GET', '/integrations/ooyala/v2/assets/' + assetId);
    },
  };

  return new OoyalaClient();
}]);

