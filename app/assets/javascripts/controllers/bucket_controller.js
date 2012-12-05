define([
  'controllers'
], function(controllers){
  'use strict';

  return controllers.controller('BucketCtrl', function($scope) {
    $scope.section = null;

    $scope.$watch('bucket', function(bucket, old, scope){
      scope.tabList.closeAll();
      if (bucket) {
        var tab = scope.tabList.add({
          viewType: 'bucket-content-entries',
          params: {
            bucketId: bucket.getId(),
            list: 'all'
          },
          title: 'Entries',
          button: {
            title: 'Create Entry',
            active: false
          }
        });
        tab.activate();
      }
    });

    $scope.$watch('bucket', function(bucket){
      if (bucket) {
        $scope.visitSection('content');
      }
    });

    $scope.$on('tabBecameActive', function(event, tab){
      if (tab.options.viewType === 'bucket-content-entries'){
        $scope.section = 'content';
        $scope.subsection = 'entries';
        $scope.tabOptions = tab.options;
      } else if (tab.options.viewType === 'bucket-content-media') {
        $scope.tabOptions = tab.options;
      }
    });

    $scope.visitSection = function(section) {
      $scope.section = section;
    };

  });
});
