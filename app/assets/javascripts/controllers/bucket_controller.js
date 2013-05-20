'use strict';

angular.module('contentful').controller('BucketCtrl', function BucketCtrl($scope, analytics, routing) {
  $scope.$watch('bucketContext', function(bucketContext, old, scope){
    var bucket = bucketContext.bucket;
    scope.bucketContext.tabList.closeAll();

    if (bucket) openRoute();
  });

  $scope.$on('$routeChangeSuccess', function (event, route) {
    if (route.noNavigate) return;
    if ($scope.bucketContext.bucket && routing.getBucketId() == $scope.getCurrentBucketId()) openRoute();
  });

  function openRoute() {
      var route = routing.getRoute();
      var tab = $scope.findTabForRoute(route);
      if (tab) tab.activate();

      if      (route.viewType == 'entry-list')
        $scope.visitView('entry-list');
      else if (route.viewType == 'entry-editor')
        $scope.bucketContext.bucket.getEntry(route.params.entryId, function (err, entry) {
          $scope.$apply(function (scope) {
            if (err) scope.visitView('entry-list');
            else     scope.editEntry(entry);
          });
        });
      else if (route.viewType == 'entry-type-list')
        $scope.visitView('entry-type-list');
      else if (route.viewType == 'entry-type-editor')
        $scope.bucketContext.bucket.getEntryType(route.params.entryTypeId, function (err, entryType) {
          $scope.$apply(function (scope) {
            if (err) scope.visitView('entry-type-list');
            else     scope.editEntryType(entryType);
          });
        });
      else
        $scope.bucketContext.bucket.getPublishedEntryTypes(function(err, ets) {
          $scope.$apply(function (scope) {
            if (_.isEmpty(ets)) scope.visitView('entry-type-list');
            else                scope.visitView('entry-list');
          });
        });
  }

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

  $scope.logoClicked = function () {
    analytics.track('Clicked Logo');
  };

  $scope.$on('entityDeleted', function (event, entity) {
    var bucketScope = event.currentScope;
    if (event.targetScope !== bucketScope) {
      bucketScope.$broadcast('entityDeleted', entity);
    }
  });

  $scope.$on('tabClosed', function (event) {
    var scope = event.currentScope;
    if (scope.bucketContext.tabList.items.length === 0) {
      $scope.visitView('entry-list');
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
        });
      } else {
        console.log('Error creating entry', err);
      }
      analytics.track('Selected Add-Button', {
        currentSection: scope.bucketContext.tabList.currentSection(),
        currentViewType: scope.bucketContext.tabList.currentViewType(),
        entityType: 'entry',
        entitySubType: entryType.getId()
      });
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
        });
      } else {
        console.log('Error creating entryType', err);
      }
      analytics.track('Selected Add-Button', {
        currentSection: scope.bucketContext.tabList.currentSection(),
        currentViewType: scope.bucketContext.tabList.currentViewType(),
        entityType: 'entryType'
      });
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
    analytics.track('Selected Add-Button', {
      currentSection: scope.bucketContext.tabList.currentSection(),
      currentViewType: scope.bucketContext.tabList.currentViewType(),
      entityType: 'apiKey'
    });
  };

});
