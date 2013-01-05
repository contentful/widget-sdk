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

    $scope.$watch('bucket', function(bucket, o, scope) {
      // TODO we need to separately track published and unpublished EntryTypes
      if (bucket) {
        bucket.getEntryTypes({order: 'sys.id', limit: 1000}, function(err, entryTypes) {
          if (err) return;
          scope.$apply(function(scope) {
            scope.bucketContext.entryTypes = entryTypes;
          });
        });
      } else {
        scope.bucketContext.entryTypes = [];
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
          canClose: true
        };
      } else if (viewType == 'entry-type-list'){
        options = {
          viewType: 'entry-type-list',
          section: 'entryTypes',
          title: 'Content Model',
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
