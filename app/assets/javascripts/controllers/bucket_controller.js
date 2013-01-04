define([
  'controllers',
  'lodash'
], function(controllers, _){
  'use strict';

  return controllers.controller('BucketCtrl', function($scope) {
    $scope.$watch('bucket', function(bucket, old, scope){
      scope.tabList.closeAll();
      if (bucket) {
        $scope.visitView('entry-list');
      }
    });

    $scope.visitView = function(viewType) {
      var options;
      if (viewType == 'entry-list'){
        options = {
          viewType: 'entry-list',
          section: 'entries',
          params: {
            bucketId: $scope.bucket.getId(),
            list: 'all'
          },
          title: 'Entries',
          button: {
            title: 'Create Entry',
            active: false
          },
          canClose: true
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
          canClose: true
        };
      }

      var tab = _($scope.tabList.items).find(function(tab) {
        return tab.viewType === options.viewType;
      });

      tab = tab || $scope.tabList.add(options);
      tab.activate();
    };

  });
});
