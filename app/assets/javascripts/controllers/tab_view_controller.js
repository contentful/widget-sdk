'use strict';

angular.module('contentful').controller('TabViewCtrl', function ($scope, authentication, analytics, routing) {
  //$scope.visitInitialView = function (bucket) {
    //var route = routing.getRoute();
    //if (route.entryList) {
      //$scope.visitView('entry-list');
    //} else if (route.entryTypeList) {
      //$scope.visitView('entry-type-list');
    //}
  //};

  $scope.editEntry = function(entry) {
    var editor = _.find($scope.bucketContext.tabList.items, function(tab){
      return (tab.viewType == 'entry-editor' && tab.params.entry.getId() == entry.getId());
    });
    if (!editor) {
      editor = $scope.bucketContext.tabList.add({
        viewType: 'entry-editor',
        section: 'entries',
        params: {
          entry: entry,
          mode: 'edit'
        },
        title: $scope.bucketContext.entryTitle(entry)
      });
    }
    editor.activate();
  };

  $scope.editEntryType = function(entryType) {
    var editor = _($scope.bucketContext.tabList.items).find(function(tab){
      return (tab.viewType == 'entry-type-editor' && tab.params.entryType == entryType);
    });
    if (!editor) {
      editor = $scope.bucketContext.tabList.add({
        viewType: 'entry-type-editor',
        section: 'entryTypes',
        params: {
          entryType: entryType,
          mode: 'edit'
        },
        title: entryType.data.name || 'Untitled'
      });
    }
    editor.activate();
  };

  $scope.editApiKey = function(apiKey) {
    var editor = _.find($scope.bucketContext.tabList.items, function(tab){
      return (tab.viewType == 'api-key-editor' && tab.params.apiKey.getId() == apiKey.getId());
    });
    if (!editor) {
      editor = $scope.bucketContext.tabList.add({
        viewType: 'api-key-editor',
        section: 'contentDelivery',
        params: {
          apiKey: apiKey,
          mode: 'edit'
        }
      });
    }
    editor.activate();
  };


  $scope.findTabForRoute = function (route) {
    return _.find($scope.bucketContext.tabList.items, function (tab) {
      return tab.viewType == route.viewType &&
             (!tab.params ||
              tab.params.entryType && tab.params.entryType.getId() === route.params.entryTypeId ||
              tab.params.entry     && tab.params.entry.getId()     === route.params.entryId);
    });
  };

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
      analytics.track('Clicked "Entries"');
    } else if (viewType == 'entry-type-list'){
      options = {
        viewType: 'entry-type-list',
        section: 'entryTypes',
        hidden: true,
        title: 'Content Model',
        canClose: true
      };
      analytics.track('Clicked "Content Model"');
    } else if (viewType == 'bucket-settings'){
      options = {
        viewType: 'iframe',
        section: 'bucketSettings',
        hidden: true,
        params: {
          url: authentication.bucketSettingsUrl($scope.bucketContext.bucket.getId()),
          fullscreen: true
        },
        title: 'Settings'
      };
      analytics.track('Clicked "Bucket Settings"');
    } else if (viewType == 'content-delivery') {
      options = {
        viewType: 'content-delivery',
        section: 'contentDelivery',
        hidden: true,
        title: 'Content Delivery',
        canClose: true
      };
      analytics.track('Clicked "Content Delivery"');
    }

    var tab = _.find($scope.bucketContext.tabList.items, function(tab) {
      return tab.viewType === options.viewType && tab.section === options.section;
    });

    tab = tab || $scope.bucketContext.tabList.add(options);
    tab.activate();
  };
});
