require([
  'angular',
  'templates/bucket_content',

  'controllers/bucket_content_controller'
], function(angular, bucketContentTemplate){
  'use strict';

  return {
    name: 'bucketContent',
    factory: function(){
      return {
        template: bucketContentTemplate(),
        restrict: 'E',
        scope: {
          bucket: '=bucket'
          },
        controller: 'BucketContentCtrl',
      };
    }
  };

});
