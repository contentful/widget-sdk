//= require jquery
//= require twitter/bootstrap
//= require ./bootstrap
//= require angular-1.0.2

define('angular', angular);

require([
  'angular',

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
      clientProvider.endpoint('http://localhost:3000');
    });

    angular.bootstrap(document, ['contentful']);
});
