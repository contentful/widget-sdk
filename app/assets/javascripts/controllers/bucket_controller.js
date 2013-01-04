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
        $scope.visitView('entry-list');
      }
    });

    $scope.visitView = function(viewType) {
      var options;
      if (viewType == 'entry-list'){
        options = {
          viewType: 'entry-list',
          section: 'content',
          params: {
            contentType: 'entries',
            bucketId: $scope.bucket.getId(),
            list: 'all'
          },
          title: 'Entries',
          button: {
            title: 'Create Entry',
            active: false
          },
          canClose: false
        };
      } else if (viewType == 'entry-type-list'){
        options = {
          viewType: 'entry-type-list',
          section: 'entryTypes',
          title: 'Content Model',
          button: {
            title: 'Create Content Type',
            active: false
          },
          canClose: false
        };
      }
      if ($scope.firstTab) {
        if ($scope.firstTab.viewType != viewType){
          $scope.firstTab = $scope.firstTab.replace(options);
        }
        if (!$scope.firstTab.active()){
          $scope.firstTab.activate();
        }
      } else {
        $scope.firstTab = $scope.tabList.add(options);
        $scope.firstTab.activate();
      }
    };

  });
});
