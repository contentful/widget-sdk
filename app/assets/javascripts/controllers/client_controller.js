angular.module('contentful/controllers').controller('ClientCtrl', function ClientCtrl($scope, client, BucketContext) {
  'use strict';

  $scope.buckets = [];
  $scope.bucketContext = new BucketContext($scope);

  $scope.selectBucket = function(bucket) {
    this.bucketContext.bucket = bucket;
  };

  $scope.$watch('buckets', function(buckets){
    if (buckets && buckets.length > 0) {
      if (!_.contains(buckets, $scope.bucketContext)) {
        $scope.bucketContext.bucket = buckets[0];
      }
    }
  });

  client.getBuckets({order: 'name'}, function(err, res){
    $scope.$apply(function($scope){
      $scope.buckets = res;
    });
  });

});
