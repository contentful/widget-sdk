//= require jquery
//= require twitter/bootstrap
//= require ./bootstrap
//= require angular-1.0.2

define('angular', angular);

require([
  'angular',
  'templates/entries',
  'controllers/client_controller',
  'controllers/entries_controller'
], function(angular, entries_template){
    'use strict';

    angular.module('contentful', [
      'services',
      'controllers'
    ], function($routeProvider, $locationProvider){
      $locationProvider.html5Mode(true);
      $routeProvider.when('/buckets/:bucketId/entry_types',{
        entitySection: 'entry_types',
        template: 'bucket_entry_types'});
      $routeProvider.when('/buckets/:bucketId/entries',{
        entitySection: 'entries',
        template: entries_template(),
        controller: 'EntriesCtrl'
        });
      $routeProvider.when('/buckets/:bucketId',{template: 'bucket_overview'});
    });

    angular.bootstrap(document, ['contentful'])
});

