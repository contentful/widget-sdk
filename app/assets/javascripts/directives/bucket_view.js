'use strict';

angular.module('contentful/directives').directive('bucketView', function(){
  return {
    template: JST.bucket_view(),
    restrict: 'E',
    controller: 'BucketCtrl'
  };
});
