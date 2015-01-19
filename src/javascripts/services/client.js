'use strict';

angular.module('contentful').provider('client', ['privateContentfulClient', function(contentfulClient){
  // contentfulClient MUST be resolved during the config phase otherwise
  // we run into weird states when mocking contentfulClient in tests.
  var Client = contentfulClient.Client;

  return {
    $get: ['$injector', function($injector){
      var clientAdapter = $injector.get('clientAdapter');
      return new Client(clientAdapter);
    }]
  };
}]);
