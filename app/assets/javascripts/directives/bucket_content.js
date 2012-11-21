require([
  'angular',
  'directives',
  'templates/bucket_content',

  'controllers/bucket_content_controller'
], function(angular, directives, bucketContentTemplate){
  'use strict';

  directives.directive('bucketContent', function(){
    var bucketContentDirective = {
      template: bucketContentTemplate(),
      restrict: 'E',
      scope: {
        bucket: '=bucket'
        },
      controller: 'BucketContentCtrl',
    };

    return bucketContentDirective;
  });
})
