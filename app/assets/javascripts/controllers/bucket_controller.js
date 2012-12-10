define([
  'controllers'
], function(controllers){
  'use strict';

  return controllers.controller('BucketCtrl', function($scope) {
    $scope.firstTab = null;

    $scope.$watch('bucket', function(bucket, old, scope){
      scope.tabList.closeAll();
      scope.firstTab = null;
      if (bucket) {
        $scope.visitView('bucket-content');
      }
    });

    //$scope.$on('tabBecameActive', function(event, tab){
    //  if (tab.viewType === 'bucket-content'){
    //    $scope.viewType = 'bucket-content';
    //    $scope.contentType = tab.params.contentType;
    //  }
    //});

    $scope.visitView = function(viewType) {
      var options;
      if (viewType == 'bucket-content'){
        options = {
          viewType: 'bucket-content',
          params: {
            contentType: 'entries',
            bucketId: $scope.bucket.getId(),
            list: 'all'
          },
          title: 'Content',
          button: {
            title: 'Create Entry',
            active: false
          },
          canClose: false
        };
      } else if (viewType == 'bucket-entryTypes'){
        options = {
          viewType: 'bucket-entryTypes',
          title: 'Content Model',
          button: {
            title: 'Create Content Type',
            active: false
          },
          canClose: false
        };
      }
      if ($scope.firstTab) {
        $scope.firstTab = $scope.firstTab.replace(options);
      } else {
        $scope.firstTab = $scope.tabList.add(options);
        $scope.firstTab.activate();
      }
    };

  });
});
