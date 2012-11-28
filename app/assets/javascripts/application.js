//= require jquery
//= require twitter/bootstrap
//= require ./bootstrap

require.config({
  paths: {
    'angular': 'angular-1.0.2',
    'sharejs': 'share/share.uncompressed',
    'share/json': 'share/json.uncompressed'
  },

  shim: {
    'angular': {
      exports: 'angular'
    },
    'sharejs': {
      deps: ['bcsocket-uncompressed'],
      exports: 'sharejs'
    },
    'share/json': ['sharejs'],
    'share/textarea': ['sharejs']
  }

});

require([
  'angular',

  'sharejs',
  'share/json',
  'share/textarea',
  'controllers/client_controller',
  'directives'
], function(angular){
    'use strict';

    angular.module('contentful', [
      'services',
      'controllers',
      'directives'
    ], function($locationProvider, clientProvider){
      $locationProvider.html5Mode(true);
      clientProvider.endpoint('http://'+window.document.location.hostname+':3000');
    });

    angular.bootstrap(document, ['contentful']);
});
