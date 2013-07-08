'use strict';

angular.module('contentful').controller('SpaceCtrl', function SpaceCtrl($scope, analytics, routing, notification, can) {
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
      else if (route.viewType == 'content-type-list')
        $scope.visitView('content-type-list');
      else if (route.viewType == 'content-type-editor')
        $scope.spaceContext.space.getContentType(route.params.contentTypeId, function (err, contentType) {
          $scope.$apply(function (scope) {
            if (err) scope.visitView('content-type-list');
            else     scope.editContentType(contentType);
          });
        });
      else if (route.viewType == 'content-delivery')
        $scope.visitView('content-delivery');
      else if (route.viewType == 'space-settings')
        $scope.visitView('space-settings');
      else if (route.viewType == 'api-key-editor')
        $scope.spaceContext.space.getApiKey(route.params.apiKeyId, function(err, apiKey) {
          $scope.$apply(function (scope) {
            if (err) scope.visitView('content-delivery');
            else     scope.editApiKey(apiKey);
          });
        });
      else
        $scope.spaceContext.space.getPublishedContentTypes(function(err, ets) {
          $scope.$apply(function (scope) {
            if (_.isEmpty(ets)) scope.visitView('content-type-list');
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
    scope.spaceContext.refreshContentTypes();
  });

  $scope.can = can;

  $scope.logoClicked = function () {
    analytics.track('Clicked Logo');
  };

  $scope.broadcastFromSpace = function(event/*, args*/){
    var args = Array.prototype.slice.call(arguments, 1, arguments.length);
    $scope.$broadcast.apply($scope, [event].concat(args));
  };

  $scope.createEntry = function(contentType) {
    var scope = this;
    scope.spaceContext.space.createEntry(contentType.getId(), {}, function(err, entry){
      scope.$apply(function (scope) {
        if (!err) {
          scope.editEntry(entry, 'create');
        } else {
          notification.error('Could not create Entry');
          //TODO sentry notification
        }
      });
      analytics.track('Selected Add-Button', {
        currentSection: scope.spaceContext.tabList.currentSection(),
        currentViewType: scope.spaceContext.tabList.currentViewType(),
        entityType: 'entry',
        entitySubType: contentType.getId()
      });
    });
  };

  $scope.createContentType = function() {
    var scope = this;
    var data = {
      sys: {},
      fields: [],
      name: ''
    };
    scope.spaceContext.space.createContentType(data, function(err, contentType){
      scope.$apply(function (scope) {
        if (!err) {
          scope.editContentType(contentType, 'create');
        } else {
          notification.error('Could not create Content Type');
          //TODO sentry notification
        }
      });
      analytics.track('Selected Add-Button', {
        currentSection: scope.spaceContext.tabList.currentSection(),
        currentViewType: scope.spaceContext.tabList.currentViewType(),
        entityType: 'contentType'
      });
    });
  };

  $scope.createApiKey = function() {
    var scope = this;
    var apiKey = scope.spaceContext.space.createBlankApiKey();
    var tab = scope.spaceContext.tabList.add({
      viewType: 'api-key-editor',
      section: 'contentDelivery',
      params: {
        apiKey: apiKey,
        mode: 'create'
      }
    });
    if (tab) tab.activate();
    analytics.track('Selected Add-Button', {
      currentSection: scope.spaceContext.tabList.currentSection(),
      currentViewType: scope.spaceContext.tabList.currentViewType(),
      entityType: 'apiKey'
    });
  };

});
