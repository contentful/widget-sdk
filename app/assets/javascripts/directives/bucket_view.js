'use strict';

angular.module('contentful').directive('bucketView', function(){
  return {
    template: JST.bucket_view(),
    restrict: 'E',
    controller: 'BucketCtrl'
  };
});
