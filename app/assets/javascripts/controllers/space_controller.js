'use strict';

angular.module('contentful').controller('SpaceCtrl', function SpaceCtrl($scope, analytics, routing) {
  $scope.$watch('spaceContext', function(spaceContext, old, scope){
    var space = spaceContext.space;
    scope.spaceContext.tabList.closeAll();

    if (space) openRoute();
  });

  $scope.$on('$routeChangeSuccess', function (event, route) {
    if (route.noNavigate) return;
    if ($scope.spaceContext.space && routing.getSpaceId() == $scope.getCurrentSpaceId()) openRoute();
  });

  function openRoute() {
      var route = routing.getRoute();
      var tab = $scope.findTabForRoute(route);
      if (tab)
        tab.activate();
      else if      (route.viewType == 'entry-list')
        $scope.visitView('entry-list');
      else if (route.viewType == 'entry-editor')
        $scope.spaceContext.space.getEntry(route.params.entryId, function (err, entry) {
          $scope.$apply(function (scope) {
            if (err) scope.visitView('entry-list');
            else     scope.editEntry(entry);
          });
        });
      else if (route.viewType == 'entry-type-list')
        $scope.visitView('entry-type-list');
      else if (route.viewType == 'entry-type-editor')
        $scope.spaceContext.space.getEntryType(route.params.entryTypeId, function (err, entryType) {
          $scope.$apply(function (scope) {
            if (err) scope.visitView('entry-type-list');
            else     scope.editEntryType(entryType);
          });
        });
      else if (route.viewType == 'content-delivery')
        $scope.visitView('content-delivery');
      else if (route.viewType == 'api-key-editor')
        $scope.spaceContext.space.getApiKey(route.params.apiKeyId, function(err, apiKey) {
          $scope.$apply(function (scope) {
            if (err) scope.visitView('content-delivery');
            else     scope.editApiKey(apiKey);
          });
        });
      else
        $scope.spaceContext.space.getPublishedEntryTypes(function(err, ets) {
          $scope.$apply(function (scope) {
            if (_.isEmpty(ets)) scope.visitView('entry-type-list');
            else                scope.visitView('entry-list');
          });
        });
  }

  $scope.$watch(function (scope) {
    if (scope.spaceContext && scope.spaceContext.space) {
      return _.map(scope.spaceContext.space.getPublishLocales(),function (locale) {
        return locale.code;
      });
    }
  }, function (codes, old, scope) {
    if (codes) scope.spaceContext.refreshLocales();
  }, true);
  $scope.$watch('spaceContext.localesActive', 'spaceContext.refreshActiveLocales()', true);
  $scope.$watch('spaceContext', function(space, o, scope) {
    scope.spaceContext.refreshEntryTypes();
  });

  $scope.logoClicked = function () {
    analytics.track('Clicked Logo');
  };

  $scope.$on('entityDeleted', function (event, entity) {
    var spaceScope = event.currentScope;
    if (event.targetScope !== spaceScope) {
      spaceScope.$broadcast('entityDeleted', entity);
    }
  });

  $scope.createEntry = function(entryType) {
    var scope = this;
    scope.spaceContext.space.createEntry(entryType.getId(), {}, function(err, entry){
      if (!err) {
        scope.$apply(function(scope){
          scope.spaceContext.tabList.add({
            viewType: 'entry-editor',
            section: 'entries',
            params: {
              entry: entry,
              space: scope.spaceContext.space,
              mode: 'create'
            },
            title: 'New Entry'
          }).activate();
        });
      } else {
        console.log('Error creating entry', err);
      }
      analytics.track('Selected Add-Button', {
        currentSection: scope.spaceContext.tabList.currentSection(),
        currentViewType: scope.spaceContext.tabList.currentViewType(),
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
    scope.spaceContext.space.createEntryType(data, function(err, entryType){
      if (!err) {
        scope.$apply(function(scope){
          scope.spaceContext.tabList.add({
            viewType: 'entry-type-editor',
            section: 'entryTypes',
            params: {
              entryType: entryType,
              space: scope.spaceContext.space,
              mode: 'create'
            },
            title: 'New Content Type'
          }).activate();
        });
      } else {
        console.log('Error creating entryType', err);
      }
      analytics.track('Selected Add-Button', {
        currentSection: scope.spaceContext.tabList.currentSection(),
        currentViewType: scope.spaceContext.tabList.currentViewType(),
        entityType: 'entryType'
      });
    });
  };

  $scope.createApiKey = function() {
    var scope = this;
    var apiKey = scope.spaceContext.space.createBlankApiKey();
    scope.spaceContext.tabList.add({
      viewType: 'api-key-editor',
      section: 'contentDelivery',
      params: {
        apiKey: apiKey,
        mode: 'create'
      }
    }).activate();
    analytics.track('Selected Add-Button', {
      currentSection: scope.spaceContext.tabList.currentSection(),
      currentViewType: scope.spaceContext.tabList.currentViewType(),
      entityType: 'apiKey'
    });
  };

});
