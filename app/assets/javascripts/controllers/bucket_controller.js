'use strict';

angular.module('contentful/controllers').controller('BucketCtrl', function BucketCtrl($scope, analytics) {
  $scope.$watch('bucketContext', function(bucketContext, old, scope){
    var bucket = bucketContext.bucket;
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

  $scope.$watch(function (scope) {
    if (scope.bucketContext && scope.bucketContext.bucket) {
      return _.map(scope.bucketContext.bucket.getPublishLocales(),function (locale) {
        return locale.code;
      });
    }
  }, function (codes, old, scope) {
    if (codes) scope.bucketContext.refreshLocales();
  }, true);
  $scope.$watch('bucketContext.localesActive', 'bucketContext.refreshActiveLocales()', true);
  $scope.$watch('bucketContext', function(bucket, o, scope) {
    scope.bucketContext.refreshEntryTypes();
  });

  $scope.$on('entityDeleted', function (event, entity) {
    var bucketScope = event.currentScope;
    if (event.targetScope !== bucketScope) {
      bucketScope.$broadcast('entityDeleted', entity);
    }
  });

  $scope.createEntry = function(entryType) {
    var scope = this;
    scope.bucketContext.bucket.createEntry(entryType.getId(), {}, function(err, entry){
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
          analytics.addButtonClicked('Select');
        });
      } else {
        console.log('Error creating entry', err);
      }
    });
  };

  $scope.createEntryType = function() {
    var scope = this;
    var data = {
      sys: {},
      fields: [],
      name: ''
    };
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
          analytics.addButtonClicked('Select');
        });
      } else {
        console.log('Error creating entryType', err);
      }
    });
  };

  $scope.createApiKey = function() {
    var scope = this;
    var apiKey = scope.bucketContext.bucket.createBlankApiKey();
    scope.bucketContext.tabList.add({
      viewType: 'api-key-editor',
      section: 'contentDelivery',
      params: {
        apiKey: apiKey,
        mode: 'create'
      }
    }).activate();
  };

});
