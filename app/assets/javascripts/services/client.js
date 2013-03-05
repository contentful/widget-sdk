'use strict';

angular.module('contentful/services').provider('client', function ClientProvider() {
  var endpoint = null;

  this.endpoint = function(e) {
    endpoint = e;
  };

  var Client = UserInterface.client;
  var Adapter = Client.adapters.jquery;

  this.$get = function() {
    return new Client(new Adapter(endpoint));
  };
});
