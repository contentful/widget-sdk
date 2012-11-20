define([
  'controllers',
  'templates/bucket-content',
  './content_controller'
], function(controllers, bucketContentTemplate){
  'use strict';

  return controllers.controller('BucketCtrl', function($scope) {
    $scope.entitySection = null;

    $scope.$watch('bucket', function(bucket){
      if (bucket) {
        $scope.entitySection = 'content';
      }
    });

    $scope.$watch('entitySection', function(section){
      if (section == 'content') {
        $scope.bucketEntityTemplate = bucketContentTemplate();
      } else {
        $scope.bucketEntityTemplate = 'No Template for '+section;
      }
    });

    $scope.visitEntitySection = function(entitySection) {
      $scope.entitySection = entitySection;
    };

  });
});
