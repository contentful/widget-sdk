define('sharejs', sharejs);

require([
  'contentful_client/client',
  'contentful_client/adapters/jquery',
  'contentful_client/sharejs'
], function(){
  'use strict';

  angular.module('contentful', [
    'contentful/services',
    'contentful/controllers',
    'contentful/directives',
    'contentful/filters'
  ], function($locationProvider, clientProvider){
    $locationProvider.html5Mode(true);
    clientProvider.endpoint('http://'+window.document.location.hostname+':3000');
  });

  angular.bootstrap(document, ['contentful']);
});
