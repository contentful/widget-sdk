'use strict';

angular.module('contentful').controller('TabViewCtrl', function ($scope, authentication, analytics, notification) {

  $scope.$on('tabClosed', function (event, tab) {
    if (tab.list.numVisible() === 0) {
      if (tab.viewType == 'entry-editor') {
        $scope.visitView('entry-list');
      } else if (tab.viewType == 'asset-editor') {
        $scope.visitView('asset-list');
      } else if (tab.viewType == 'content-type-editor') {
        $scope.visitView('content-type-list');
      } else if (tab.viewType == 'api-key-editor') {
        $scope.visitView('api-key-list');
      }
    }
  });

  $scope.editEntity = function (entity, mode) {
    if(entity.data.sys.type == 'Entry')
      $scope.editEntry(entity, mode);
    if(entity.data.sys.type == 'Asset')
      $scope.editAsset(entity, mode);
  };

  $scope.editEntry = function(entry, mode) {
    if (! (entry && entry.data)) return notification.error('Can\'t open Entry');

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


  $scope.editAsset = function(asset, mode) {
    if (!(asset && asset.data)) return notification.error('Can\'t open Asset');

    mode = mode || 'edit';
    var editor = _.find($scope.spaceContext.tabList.items, function(tab){
      return (tab.viewType == 'asset-editor' && tab.params.asset.getId() == asset.getId());
    });
    if (!editor) {
      editor = $scope.spaceContext.tabList.add({
        viewType: 'asset-editor',
        section: 'assets',
        params: {
          asset: asset,
          mode: mode
        }
      });
    }
    if (editor) editor.activate();
  };


  $scope.editContentType = function(contentType, mode) {
    if (! (contentType && contentType.data)) return notification.error('Can\'t open Content Type');

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

  $scope.showTabBar = function () {
    return !_.every($scope.spaceContext.tabList.items, function(item){ return item.hidden; });
  };

  $scope.editApiKey = function(apiKey) {
    if (! (apiKey && apiKey.data)) return notification.error('Can\'t open API Key');

    var editor = _.find($scope.spaceContext.tabList.items, function(tab){
      return (tab.viewType == 'api-key-editor' && tab.params.apiKey.getId() == apiKey.getId());
    });
    if (!editor) {
      editor = $scope.spaceContext.tabList.add({
        viewType: 'api-key-editor',
        section: 'apiKeys',
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

    // TODO this can be split into one method per route and then moved into the individual routes
    function tabMatches(tab) {
      return tab.viewType == route.viewType &&
             (
               !tab.params ||
               (
                 tab.params.contentType && tab.params.contentType.getId() === route.params.contentTypeId ||
                 tab.params.apiKey      && tab.params.apiKey.getId()      === route.params.apiKeyId ||
                 tab.params.asset       && tab.params.asset.getId()       === route.params.assetId ||
                 tab.params.entry       && tab.params.entry.getId()       === route.params.entryId
               )
             ) ||
             tab.section == 'spaceSettings' && route.viewType == 'space-settings'||
             (
               route.viewType == 'api-key-list' &&
               tab.viewType == 'api-key-editor' &&
               tab.params.apiKey.getId() === undefined
             ) ||
             (
               route.viewType == 'entry-list'        && tab.viewType   == 'entry-list' ||
               route.viewType == 'asset-list'        && tab.viewType   == 'asset-list' ||
               route.viewType == 'content-type-list' && tab.viewType   == 'content-type-list'
             );
    }
  };

  $scope.visitSettings = function (pathSuffix) {
    return findOrCreateTab({
      viewType: 'iframe',
      section: 'spaceSettings',
      hidden: true,
      params: {
        mode: 'spaceSettings',
        pathSuffix: pathSuffix,
        fullscreen: true
      },
      title: 'Settings'
    });
  };

  $scope.visitView = function(viewType) {
    var options;
    if (viewType == 'entry-list'){
      analytics.track('Clicked "Entries"');
      return findOrCreateTab({
        viewType: 'entry-list',
        section: 'entries',
        hidden: true,
        params: {
          spaceId: $scope.spaceContext.space.getId(),
          list: 'all'
        },
        title: 'Entries',
        canClose: true
      });
    } else if (viewType == 'asset-list'){
      analytics.track('Clicked "Assets"');
      return findOrCreateTab({
        viewType: 'asset-list',
        section: 'assets',
        hidden: true,
        params: {
          spaceId: $scope.spaceContext.space.getId(),
          list: 'all'
        },
        title: 'Assets',
        canClose: true
      });
    } else if (viewType == 'content-type-list'){
      analytics.track('Clicked "Content Model"');
      return findOrCreateTab({
        viewType: 'content-type-list',
        section: 'contentTypes',
        hidden: true,
        title: 'Content Model',
        canClose: true
      });
    } else if (viewType == 'space-settings'){
      analytics.track('Clicked "Space Settings"');
      return this.visitSettings();
    } else if (viewType == 'api-key-list') {
      analytics.track('Clicked "Content Delivery"');
      return findOrCreateTab({
        viewType: 'api-key-list',
        section: 'apiKeys',
        hidden: true,
        title: 'Content Delivery',
        canClose: true
      });
    }

    return findOrCreateTab(options);
  };

  function findOrCreateTab(options) {
    var tab = _.find($scope.spaceContext.tabList.items, function(tab) {
      return tab.viewType === options.viewType && tab.section === options.section;
    });

    tab = tab || $scope.spaceContext.tabList.add(options);
    if (tab) tab.activate();

    return tab;
  }
});
