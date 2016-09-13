'use strict';

angular.module('contentful')

// TODO this should be "data/" service
.controller('ApiKeyController', ['$injector', function ($injector) {

  var spaceContext = $injector.get('spaceContext');

  var apiKeyListPromise;

  this.getApiKeyList = function (refresh) {
    if (!apiKeyListPromise || refresh) {
      apiKeyListPromise = spaceContext.space.getDeliveryApiKeys({limit: 1000});
    }
    return apiKeyListPromise;
  };

}]);
