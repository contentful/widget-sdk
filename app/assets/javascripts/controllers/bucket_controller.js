'use strict';

angular.module('contentful/controllers').controller('BucketCtrl', function BucketCtrl($scope, authentication) {
  $scope.$watch('bucketContext.bucket', function(bucket, old, scope){
    scope.bucketContext.tabList.closeAll();

    if (bucket) {
      //bucket.getEntryType('allfields', function(err, entryType) {
        //scope.$apply(function(scope) {
          //var editor = scope.bucketContext.tabList.add({
            //viewType: 'entry-type-editor',
            //section: 'entryTypes',
            //params: {
              //entryType: entryType,
              //mode: 'edit'
            //},
            //title: 'Edit Content Type'
          //});
          //editor.activate();
        //});
      //});
      $scope.visitView('entry-list');
    }
  });

  $scope.$watch('bucketContext.bucket.locales', 'bucketContext.refreshLocales()', true);
  $scope.$watch('bucketContext.localesActive', 'bucketContext.refreshActiveLocales()', true);
  $scope.$watch('bucketContext.bucket', function(bucket, o, scope) {
    scope.bucketContext.refreshEntryTypes(scope);
  });

  $scope.visitView = function(viewType) {
    var options;
    if (viewType == 'entry-list'){
      options = {
        viewType: 'entry-list',
        section: 'entries',
        hidden: true,
        params: {
          bucketId: $scope.bucketContext.bucket.getId(),
          list: 'all'
        },
        title: 'Entries',
        canClose: true
      };
    } else if (viewType == 'entry-type-list'){
      options = {
        viewType: 'entry-type-list',
        section: 'entryTypes',
        hidden: true,
        title: 'Content Model',
        canClose: true
      };
    } else if (viewType == 'bucket-settings'){
      options = {
        viewType: 'iframe',
        section: 'bucketSettings',
        params: {
          url: authentication.bucketSettingsUrl($scope.bucketContext.bucket.getId()),
          fullscreen: false
        },
        title: 'Bucket Settings'
      };
    }

    var tab = _.find($scope.bucketContext.tabList.items, function(tab) {
      return tab.viewType === options.viewType && tab.section === options.section;
    });

    tab = tab || $scope.bucketContext.tabList.add(options);
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
    scope.bucketContext.bucket.createEntry({
      sys: {
        entryType: entryType.getId()
      }
    }, function(err, entry){
      if (!err) {
        scope.$apply(function(scope){
          scope.bucketContext.tabList.add({
            viewType: 'entry-editor',
            section: 'entries',
            params: {
              entry: entry,
              bucket: scope.bucketContext.bucket,
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
    scope.bucketContext.bucket.createEntryType(data, function(err, entryType){
      if (!err) {
        scope.$apply(function(scope){
          scope.bucketContext.tabList.add({
            viewType: 'entry-type-editor',
            section: 'entryTypes',
            params: {
              entryType: entryType,
              bucket: scope.bucketContext.bucket,
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
