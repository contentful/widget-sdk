define([
  'angular',
  'templates/bucket_view',

  'controllers/bucket_controller'
], function(angular, bucketViewTemplate){
  'use strict';

  return {
    name: 'bucketView',
    factory: function(){
      return {
        template: bucketViewTemplate(),
        restrict: 'E',
        scope: {
          tabList: '=',
          bucket: '=',
          bucketContext: '='
        },
        controller: 'BucketCtrl'
      };
    }
  };

});
