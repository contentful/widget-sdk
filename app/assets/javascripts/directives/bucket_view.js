'use strict';

angular.module('contentful/directives').directive('bucketView', function(){
  return {
    template: JST.bucket_view(),
    restrict: 'E',
    scope: {
      tabList: '=',
      bucketContext: '='
    },
    controller: 'BucketCtrl'
  };
});
