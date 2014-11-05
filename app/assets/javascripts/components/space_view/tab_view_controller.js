'use strict';
angular.module('contentful').controller('TabViewController', ['$scope', '$injector', function ($scope, $injector) {
  var analytics = $injector.get('analytics');
  var routing = $injector.get('routing');
  var TabOptionsGenerator = $injector.get('TabOptionsGenerator');
  var $document = $injector.get('$document');
  var editingInterfaces = $injector.get('editingInterfaces');

  var gen = TabOptionsGenerator;
  $scope.$on('tabClosed', function (event, tab) {
    if (tab.list.numVisible() > 0) return;
    if      (tab.viewType == 'asset-editor')        $scope.navigator.assetList().goTo();
    else if (tab.viewType == 'content-type-editor') $scope.navigator.contentTypeList().goTo();
    else if (tab.viewType == 'api-key-editor')      $scope.navigator.apiKeyList().goTo();
    else $scope.navigator.entryList().goTo();
  });

  $scope.$on('tabBecameActive', function (event, tab) {
    $scope.goToTab(tab);
  });

  $scope.$watch('spaceContext', function(spaceContext, old, scope){
    var space = spaceContext.space;
    scope.spaceContext.tabList.closeAll();
    if (space) openRoute();
  });

  $scope.$on('$routeChangeSuccess', function () {
    if ($scope.spaceContext && $scope.spaceContext.space && $scope.spaceContext.space.isHibernated())
      analytics.track('Viewed Placeholder Page');
    if ($scope.spaceContext.space && routing.getSpaceId() == $scope.getCurrentSpaceId())
      openRoute();
    else
      if ($scope.spaceContext) $scope.spaceContext.tabList.current = null;
  });

  function openRoute() {
    var path = routing.getPath();
    var route = routing.getRoute();
    var tab = $scope.findTabForPath(path);
    if (tab)
      tab.activate();
    else if (route.viewType && route.viewType.match(/^(entry|asset|content-type|api-key)-list$/))
      $scope.navigator.forViewType(route.viewType).open();
    else if (route.viewType == 'content-model')
      $scope.navigator.contentModel().open();
    else if (route.viewType == 'api-home')
      $scope.navigator.apiHome().open();
    else if (route.viewType == 'space-settings')
      $scope.navigator.spaceSettings(route.params.pathSuffix).open();
    else if (route.viewType == 'entry-editor')
      handleFallback('entryEditor', 'entryList',
        $scope.spaceContext.space.getEntry(route.params.entryId));
    else if (route.viewType == 'asset-editor')
      handleFallback('assetEditor', 'assetList',
        $scope.spaceContext.space.getAsset(route.params.assetId));
    else if (route.viewType == 'content-type-editor')
      handleFallback('contentTypeEditor', 'contentTypeList',
        $scope.spaceContext.space.getContentType(route.params.contentTypeId));
    else if (route.viewType == 'editing-interface-editor'){
      $scope.spaceContext.space.getContentType(route.params.contentTypeId)
      .then(function(contentType){
        editingInterfaces.forContentTypeWithId(contentType, route.params.editingInterfaceId)
        .then(function (editingInterface) {
          $scope.navigator.editingInterfaceEditor(contentType, editingInterface).open();
        }, function(){
          $scope.navigator.contentTypeEditor(contentType).goTo();
        });
      }, function(){
        $scope.navigator.contentTypeList().goTo();
      });
    } else if (route.viewType == 'api-key-editor')
      handleFallback('apiKeyEditor', 'apiKeyList',
        $scope.spaceContext.space.getDeliveryApiKey(route.params.apiKeyId));
    else
      $scope.spaceContext.space.getPublishedContentTypes()
      .then(function(ets){
        if (_.isEmpty(ets)) $scope.navigator.contentTypeList().goTo();
        else                $scope.navigator.entryList().goTo();
      }, function(){
        $scope.navigator.entryList().goTo();
      });

    function handleFallback(defaultView, fallbackView, promise) {
      return promise
      .then(function(obj){
        $scope.navigator[defaultView](obj).open();
      }, function(){
        $scope.navigator[fallbackView]().goTo();
      });
    }

  }

  $scope.navigator = {
    _wrap: function (options) {
      return {
        open: function () { return findOrCreateTab(options); },
        goTo: function () { routing.goToTab(options, $scope.spaceContext.space); },
        path: function () { return routing.makeLocation(options, $scope.spaceContext.space); },
        openAndGoTo: function () {
          var tab = this.open();
          this.goTo();
          return tab;
        }
      };
    },
    entityEditor:      function (entity) {
      if(entity.getType() == 'Entry') return this.entryEditor(entity);
      if(entity.getType() == 'Asset') return this.assetEditor(entity);
    },
    entryEditor:             function (entity) { return this._wrap(gen.entryEditor(entity)); },
    assetEditor:             function (entity) { return this._wrap(gen.assetEditor(entity)); },
    apiKeyEditor:            function (entity) { return this._wrap(gen.apiKeyEditor(entity)); },
    contentTypeEditor:       function (entity) { return this._wrap(gen.contentTypeEditor(entity)); },
    editingInterfaceEditor:  function (contentType, editingInterface) { return this._wrap(gen.editingInterfaceEditor(contentType, editingInterface)); },
    entryList:               function () { return this._wrap(gen.entryList()); },
    contentTypeList:         function () { return this._wrap(gen.contentTypeList()); },
    apiKeyList:              function () { return this._wrap(gen.apiKeyList()); },
    contentModel:            function () { return this._wrap(gen.contentModel()); },
    apiHome:                 function () { return this._wrap(gen.apiHome()); },
    assetList:               function () { return this._wrap(gen.assetList()); },
    forViewType:             function (viewType) { return this._wrap(gen.forViewType(viewType)); },
    spaceSettings:           function (pathSuffix) { return this._wrap(gen.spaceSettings(pathSuffix)); }
  };

  $scope.goToTab = function (tab) {
    routing.goToTab(tab, $scope.spaceContext.space);
  };

  $scope.findTabForPath = function (path) {
    return _.find($scope.spaceContext.tabList.items, function (tab) {
      var isSpaceSettings = tab.viewType == 'space-settings' && path.match(/spaces\/\w+\/settings\/(.*$)/);
      var pathMatches = routing.makeLocation(tab, $scope.spaceContext.space) == path;
      return isSpaceSettings || pathMatches;
    });
  };

  $scope.goToView = function(viewType) {
    if      (viewType == 'entry-list')        analytics.track('Clicked "Entries"');
    else if (viewType == 'asset-list')        analytics.track('Clicked "Assets"');
    else if (viewType == 'content-type-list') analytics.track('Clicked "Content Model"');
    else if (viewType == 'space-settings')    analytics.track('Clicked "Space Settings"');
    else if (viewType == 'api-home')          analytics.track('Clicked "api"');
    else return;
    $scope.navigator.forViewType(viewType).goTo();
  };

  function findOrCreateTab(options) {
    var location = routing.makeLocation(options);
    var tab = $scope.findTabForPath(location) || $scope.spaceContext.tabList.add(options);
    if (tab) tab.activate();

    return tab;
  }

  $scope.$watch('spaceContext.tabList.current.title', function (title, old, scope) {
    try {
      if (title) {
        $document[0].title = scope.spaceContext.space.data.name + ' - ' + title;
      } else {
        $document[0].title = scope.spaceContext.space.data.name;
      }
    } catch (e) {
      $document[0].title = 'Contentful';
    }
  });

}]);
