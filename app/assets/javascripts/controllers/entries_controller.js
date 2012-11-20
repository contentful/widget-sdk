define([
  'controllers',
], function(controllers){
  'use strict';

  return controllers.controller('EntriesCtrl', function($scope, client) {
      // $scope.bucket  = null;
      // $scope.buckets = [];
      // $scope.entitySection = 'entries';
      // 
      // $scope.$watch('bucket', function(bucket){
      //   if (bucket) {
      //     $scope.entitySection = 'entries';
      //     routing.entitySection = 'entries';
      //     routing.visitBucketId(bucket.data.meta.id);
      //   }
      // });
      // 
      // $scope.visitEntitySection = function(entitySection) {
      //   $scope.entitySection = entitySection;
      //   routing.visitEntitySection(entitySection);
      // };
      // 
      // client.getBuckets(function(err, res){
      //   $scope.$apply(function($scope){
      //     $scope.buckets = res;
      //     $scope.bucket  = res[0];
      //   })
      // });

    });
});
