angular.module('contentful').provider('client', function ClientProvider(contentfulClient) {
  'use strict';

  var endpoint = null;

  this.endpoint = function(e) {
    endpoint = e;
  };

  var Client = contentfulClient.Client;
  var Adapter = contentfulClient.adapters.jquery;

  this.$get = function() {
    return new Client(new Adapter(endpoint));
  };
});
