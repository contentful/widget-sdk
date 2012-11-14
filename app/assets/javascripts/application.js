//= require twitter/bootstrap

require([
  'contentful_client/client',
  'contentful_client/adapters/jquery',
  ], function(Client, Adapter){
  window.Client = Client;
  window.Adapter = Adapter;
})