define([
  'controllers',
  'lib/tab_list',

  'services/client',
  'controllers/bucket_controller'
], function(controllers, TabList){
  'use strict';

  return controllers.controller('ClientCtrl', function($scope, client) {
      $scope.bucket  = null;
      $scope.buckets = [];
      $scope.tabList = new TabList($scope);

      $scope.$watch('buckets', function(buckets){
        if (buckets && buckets.length > 0) {
          $scope.bucket = buckets[0];
        }
      });

      client.getBuckets({order: 'name'}, function(err, res){
        $scope.$apply(function($scope){
          $scope.buckets = res;
        });
      });

    });
});
