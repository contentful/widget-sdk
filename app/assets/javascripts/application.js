//= require jquery
//= require twitter/bootstrap
//= require ./bootstrap
//= require angular-1.0.2

define('angular', angular);

require([
  'angular',
  'controllers/app_controller'
], function(angular){
    'use strict';

    angular.module('contentful', [
      'services',
      'controllers'
    ], function($routeProvider, $locationProvider){
      // $routeProvider.when('/buckets/:bucketId',{
      //   template: 'bucket_overview',
      //   
      //   })
      
    });

    angular.bootstrap(document, ['contentful'])
});

