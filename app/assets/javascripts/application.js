//= require jquery
//= require twitter/bootstrap
//= require ./bootstrap
//= require angular-1.0.2

define('angular', angular);

require([
  'angular',

  'controllers/client_controller',
  'directives/bucket_view',
  'directives/bucket_content',
  'directives/entry_list'
], function(angular){
    'use strict';

    angular.module('contentful', [
      'services',
      'controllers',
      'directives'
    ], function($locationProvider){
      $locationProvider.html5Mode(true);
    });

    angular.bootstrap(document, ['contentful'])
});

