define([
  'services',
  'contentful_client/client',
  'contentful_client/adapters/jquery'
], function(services, Client, Adapter){
  'use strict';

  function ClientProvider(){
    var endpoint = null;

    this.endpoint = function(e) {
      endpoint = e;
    };

    this.$get = function() {
      if (endpoint) {
        return new Client(new Adapter(endpoint));
      } else {
        return new Client(new Adapter);
      }
    }
  }

  return services.provider('client', ClientProvider);
});
