define([
  'services',
  'contentful_client/client',
  'contentful_client/adapters/jquery'
], function(services, Client, Adapter){
  'use strict';

  return services.service('client', function(){
    return new Client(new Adapter);
  });
});
