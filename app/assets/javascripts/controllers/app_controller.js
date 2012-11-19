define([
  'controllers',
  'services/client'
], function(controllers){
  'use strict';

  return controllers.controller('AppCtrl', function($scope, client) {
      $scope.bucket  = null;
      $scope.buckets = [];
      $scope.entitySection = 'entry';

      client.getBuckets(function(err, res){
        $scope.$apply(function($scope){
          $scope.buckets = res;
          $scope.bucket  = res[0];
        })
      })
    });
});
