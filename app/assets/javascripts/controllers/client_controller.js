angular.module('contentful/controllers').controller('ClientCtrl', function ClientCtrl($scope, client, BucketContext, authentication, QueryLinkResolver) {
  'use strict';

  $scope.buckets = [];
  $scope.bucketContext = new BucketContext($scope);

  $scope.user = null;

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

  authentication.getTokenLookup(function(tokenLookup) {

    //$scope.user = tokenLookup;
    tokenLookup = QueryLinkResolver.resolveQueryLinks(tokenLookup).items[0];
    //var user = tokenLookup.user;
    $scope.$apply(function(scope) {
      scope.buckets = _.map(tokenLookup.buckets, function(bucketData) {
        return client.wrapBucket(bucketData);
      });
    });
    
    //client.getBuckets({order: 'name'}, function(err, res){
      //$scope.$apply(function($scope){
        //$scope.buckets = res;
      //});
    //});
  });



});
