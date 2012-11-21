require([
  'angular',
  'directives',
  'templates/bucket_view',

  'controllers/bucket_controller'
], function(angular, directives, bucketViewTemplate){
  'use strict';

  directives.directive('bucketView', function(){
    var bucketViewDirective = {
      template: bucketViewTemplate(),
      restrict: 'E',
      scope: {
        bucket: '=bucket'
        },
      controller: 'BucketCtrl',
      // link: function(scope, element, attrs, controller) {
      //   scope.$parent.$watch(
      //     function(parentScope) {
      //       return parentScope.$eval(attrs.bucket);
      //     },
      //     function(bucket) {
      //       scope.bucket = bucket;
      //     }
      //   );
      // }
    };

    return bucketViewDirective;
  });
})
