'use strict';

angular.module('contentful').controller('TabViewCtrl', function ($scope, authentication, analytics) {

  $scope.$on('tabClosed', function (event, tab) {
    var scope = event.currentScope;
    if (scope.spaceContext.tabList.items.length === 0) {
      $scope.visitView('entry-list');
    } else if (tab.list.numVisible() === 0) {
      if (tab.viewType == 'entry-editor') {
        $scope.visitView('entry-list');
      } else if (tab.viewType == 'entry-type-editor') {
        $scope.visitView('entry-type-list');
      } else if (tab.viewType == 'api-key-editor') {
        $scope.visitView('content-delivery');
      }
    }
  });

  $scope.editEntry = function(entry) {
    var editor = _.find($scope.spaceContext.tabList.items, function(tab){
      return (tab.viewType == 'entry-editor' && tab.params.entry.getId() == entry.getId());
    });
    if (!editor) {
      editor = $scope.spaceContext.tabList.add({
        viewType: 'entry-editor',
        section: 'entries',
        params: {
          entry: entry,
          mode: 'edit'
        },
        title: $scope.spaceContext.entryTitle(entry)
      });
    }
    editor.activate();
  };

  $scope.editEntryType = function(entryType) {
    var editor = _($scope.spaceContext.tabList.items).find(function(tab){
      return (tab.viewType == 'entry-type-editor' && tab.params.entryType == entryType);
    });
    if (!editor) {
      editor = $scope.spaceContext.tabList.add({
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
    var editor = _.find($scope.spaceContext.tabList.items, function(tab){
      return (tab.viewType == 'api-key-editor' && tab.params.apiKey.getId() == apiKey.getId());
    });
    if (!editor) {
      editor = $scope.spaceContext.tabList.add({
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
    return _.find($scope.spaceContext.tabList.items, function (tab) {
      return tab.viewType == route.viewType &&
             (!tab.params ||
              tab.params.entryType && tab.params.entryType.getId() === route.params.entryTypeId ||
              tab.params.apiKey    && tab.params.apiKey.getId()    === route.params.apiKeyId ||
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
          spaceId: $scope.spaceContext.space.getId(),
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
    } else if (viewType == 'space-settings'){
      options = {
        viewType: 'iframe',
        section: 'spaceSettings',
        hidden: true,
        params: {
          url: authentication.spaceSettingsUrl($scope.spaceContext.space.getId()),
          fullscreen: true
        },
        title: 'Settings'
      };
      analytics.track('Clicked "Space Settings"');
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

    var tab = _.find($scope.spaceContext.tabList.items, function(tab) {
      return tab.viewType === options.viewType && tab.section === options.section;
    });

    tab = tab || $scope.spaceContext.tabList.add(options);
    tab.activate();
  };
});
