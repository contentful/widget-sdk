define([
  'controllers',
  'services/client',
  'controllers/bucket_controller'
], function(controllers){
  'use strict';

  return controllers.controller('ClientCtrl', function($scope, client) {
      $scope.bucket  = null;
      $scope.buckets = [];

      $scope.$watch('buckets', function(buckets){
        if (buckets && buckets.length > 0) {
          $scope.bucket = buckets[0];
        }
      });

      client.getBuckets(function(err, res){
        $scope.$apply(function($scope){
          $scope.buckets = res;
        });
      });

    });
});
