'use strict';

angular.module('contentful/services').provider('client', function ClientProvider() {
  var endpoint = null;

  this.endpoint = function(e) {
    endpoint = e;
  };

  var Client = require('contentful_client/client');
  var Adapter = require('contentful_client/adapters/jquery');

  this.$get = function() {
    if (endpoint) {
      return new Client(new Adapter(endpoint));
    } else {
      return new Client(new Adapter());
    }
  };
});
