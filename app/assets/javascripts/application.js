// Modules that were loaded through static.js but are referenced by CommonJS modules
define('sharejs', sharejs);
define('jquery', [
], function () {
  /*global jQuery:false*/
  'use strict';
  return jQuery;
});

require([
  'contentful_client/client',
  'contentful_client/query_link_resolver',
  'contentful_client/adapters/jquery',
  'contentful_client/sharejs',
  'worf',
  'validation/lib/validation',
], function(){
  'use strict';

  angular.module('contentful', [
    'contentful/classes',
    'contentful/services',
    'contentful/controllers',
    'contentful/directives',
    'contentful/filters'
  ], function($locationProvider, clientProvider){
    $locationProvider.html5Mode(true);
    clientProvider.endpoint('http://api.lvh.me:8888');
  }).run(function(authentication, client) {
    authentication.login();
    client.persistenceContext.adapter.token = authentication.token;
  });

  angular.bootstrap(document, ['contentful']);
});
