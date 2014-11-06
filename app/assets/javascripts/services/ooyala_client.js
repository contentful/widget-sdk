'use strict';

angular.module('contentful').factory('ooyalaClient', ['$injector', function($injector){

  function OoyalaClient(){
    this.clientAdapter = $injector.get('clientAdapter');
  }

  OoyalaClient.prototype = {
    request: function(organizationId, method, endpoint, payload) {
      return this.clientAdapter.request({
        method   : method,
        endpoint : endpoint,
        payload  : payload,
        headers: {
          'X-Contentful-Organization' : organizationId
        }
      });
    },

    asset: function(organizationId, assetId) {
      return this.request(organizationId, 'GET', '/integrations/ooyala/v2/assets/' + assetId)
      .then(function(response){
        return response;
      });
    },
  };

  return new OoyalaClient();
}]);

