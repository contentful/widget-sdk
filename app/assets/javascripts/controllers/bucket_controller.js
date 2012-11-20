define([
  'controllers',
], function(controllers, _){
  'use strict';

  return controllers.controller('BucketCtrl', function($scope) {
    $scope.entitySection = null;

    $scope.$watch('bucket', function(bucket){
      if (bucket) {
        $scope.entitySection = 'entries';
      }
    });

    $scope.visitEntitySection = function(entitySection) {
      $scope.entitySection = entitySection;
    };
  });
});
