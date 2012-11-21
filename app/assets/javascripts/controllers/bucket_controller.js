define([
  'controllers',
], function(controllers, bucketContentTemplate){
  'use strict';

  return controllers.controller('BucketCtrl', function($scope) {
    $scope.section = null;

    $scope.$watch('bucket', function(bucket){
      if (bucket) {
        $scope.section = 'content';
      }
    });

    $scope.visitSection = function(section) {
      $scope.section = section;
    };

  });
});
