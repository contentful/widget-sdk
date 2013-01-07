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
      if (bucket) {
        scope.bucketContext.refreshEntryTypes(scope);
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


    $scope.$on('tabListButtonClicked', function(event, info) {
      var scope = event.currentScope;
      if (info.button === 'createEntry') {
        scope.createEntry(info.entryType);
      } else if (info.button === 'createEntryType') {
        scope.createEntryType();
      }
    });

    $scope.createEntry = function(entryType) {
      var scope = this;
      scope.bucket.createEntry({
        sys: {
          entryType: entryType.getId()
        }
      }, function(err, entry){
        if (!err) {
          scope.$apply(function(scope){
            scope.tabList.add({
              viewType: 'entry-editor',
              section: 'entries',
              params: {
                entry: entry,
                bucket: scope.bucket,
                mode: 'create'
              },
              title: 'New Entry'
            }).activate();
          });
        } else {
          console.log('Error creating entry', err);
        }
      });
    };

    $scope.createEntryType = function() {
      var scope = this;
      var id = window.prompt('Please enter ID (only for development)');
      var data;
      if (!id || id === '') {
        data = {
          sys: {},
          fields: [],
          name: 'Unnamed Content Type'
        };
      } else {
        data = {
          sys: {
            id: id
          },
          fields: [],
          name: id
        };
      }
      scope.bucket.createEntryType(data, function(err, entryType){
        if (!err) {
          scope.$apply(function(scope){
            scope.tabList.add({
              viewType: 'entry-type-editor',
              section: 'entryTypes',
              params: {
                entryType: entryType,
                bucket: scope.bucket,
                mode: 'create'
              },
              title: 'New Content Type'
            }).activate();
          });
        } else {
          console.log('Error creating entryType', err);
        }
      });
    };

  });
});
