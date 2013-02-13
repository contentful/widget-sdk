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
  'contentful_client/adapters/jquery',
  'contentful_client/sharejs'
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
    clientProvider.endpoint('http://'+window.document.location.hostname+':3000');
  });

  angular.bootstrap(document, ['contentful']);
});
