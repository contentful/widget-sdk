'use strict';

angular.module('contentful').controller('TabViewCtrl', function ($scope, authentication, analytics) {

  $scope.$on('tabClosed', function (event, tab) {
    var scope = event.currentScope;
    if (scope.spaceContext.tabList.items.length === 0) {
      $scope.visitView('entry-list');
    } else if (tab.list.numVisible() === 0) {
      if (tab.viewType == 'entry-editor') {
        $scope.visitView('entry-list');
      } else if (tab.viewType == 'content-type-editor') {
        $scope.visitView('content-type-list');
      } else if (tab.viewType == 'api-key-editor') {
        $scope.visitView('content-delivery');
      }
    }
  });

  $scope.editEntry = function(entry, mode) {
    mode = mode || 'edit';
    var editor = _.find($scope.spaceContext.tabList.items, function(tab){
      return (tab.viewType == 'entry-editor' && tab.params.entry.getId() == entry.getId());
    });
    if (!editor) {
      editor = $scope.spaceContext.tabList.add({
        viewType: 'entry-editor',
        section: 'entries',
        params: {
          entry: entry,
          mode: mode
        },
        title: $scope.spaceContext.entryTitle(entry)
      });
    }
    if (editor) editor.activate();
  };

  $scope.editContentType = function(contentType, mode) {
    mode = mode || 'edit';
    var editor = _($scope.spaceContext.tabList.items).find(function(tab){
      return (tab.viewType == 'content-type-editor' && tab.params.contentType == contentType);
    });
    if (!editor) {
      editor = $scope.spaceContext.tabList.add({
        viewType: 'content-type-editor',
        section: 'contentTypes',
        params: {
          contentType: contentType,
          mode: mode
        },
        title: contentType.getName()
      });
    }
    if (editor) editor.activate();
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
    if (editor) editor.activate();
  };


  $scope.findTabForRoute = function (route) {
    var currentTab = $scope.spaceContext.tabList.current;
    if (currentTab && tabMatches(currentTab))
      return currentTab;
    else
      return _.find($scope.spaceContext.tabList.items, tabMatches);

    function tabMatches(tab) {
      return tab.viewType == route.viewType &&
             !tab.params ||
             (
               tab.params.contentType && tab.params.contentType.getId() === route.params.contentTypeId ||
               tab.params.apiKey    && tab.params.apiKey.getId()    === route.params.apiKeyId ||
               tab.params.entry     && tab.params.entry.getId()     === route.params.entryId
             ) ||
             tab.section == 'spaceSettings' ||
             (
               route.viewType == 'content-delivery' &&
               tab.viewType == 'api-key-editor' &&
               tab.params.apiKey.getId() === undefined
             ) ||
             (
               route.viewType == 'entry-list' &&
               tab.viewType   == 'entry-list'
             );
    }
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
    } else if (viewType == 'content-type-list'){
      options = {
        viewType: 'content-type-list',
        section: 'contentTypes',
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
    if (tab) tab.activate();
  };
});
