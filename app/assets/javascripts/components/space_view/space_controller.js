'use strict';

angular.module('contentful').controller('SpaceCtrl', function SpaceCtrl($scope, analytics, routing, notification, can) {
  $scope.$watch(function (scope) {
    if (scope.spaceContext && scope.spaceContext.space) {
      return _.map(scope.spaceContext.space.getPublishLocales(),function (locale) {
        return locale.code;
      });
    }
  }, function (codes, old, scope) {
    if (codes) scope.spaceContext.refreshLocales();
  }, true);
  $scope.$watch('spaceContext.localeStates', 'spaceContext.refreshActiveLocales()', true);
  $scope.$watch('spaceContext', function(space, o, scope) {
    scope.spaceContext.refreshContentTypes();
  });

  $scope.can = can;

  $scope.logoClicked = function () {
    analytics.track('Clicked Logo');
  };

  $scope.broadcastFromSpace = function(){
    $scope.$broadcast.apply($scope, arguments);
  };

  $scope.createEntry = function(contentType) {
    var scope = this;
    scope.spaceContext.space.createEntry(contentType.getId(), {}, function(err, entry){
      scope.$apply(function (scope) {
        if (!err) {
          scope.navigator.entryEditor(entry).goTo();
        } else {
          notification.serverError('Could not create Entry', err);
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

  $scope.createAsset = function() {
    var scope = this;
    var data = {
      sys: {
        type: 'Asset'
      },
      fields: {}
    };

    scope.spaceContext.space.createAsset(data, function(err, asset){
      scope.$apply(function (scope) {
        if (!err) {
          scope.navigator.assetEditor(asset).goTo();
        } else {
          notification.serverError('Could not create Asset', err);
        }
      });
      analytics.track('Selected Add-Button', {
        currentSection: scope.spaceContext.tabList.currentSection(),
        currentViewType: scope.spaceContext.tabList.currentViewType(),
        entityType: 'asset',
        entitySubType: asset && asset.getId()
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
          scope.navigator.contentTypeEditor(contentType).goTo();
        } else {
          notification.serverError('Could not create Content Type', err);
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
    scope.navigator.apiKeyEditor(apiKey).openAndGoTo();
    analytics.track('Selected Add-Button', {
      currentSection: scope.spaceContext.tabList.currentSection(),
      currentViewType: scope.spaceContext.tabList.currentViewType(),
      entityType: 'apiKey'
    });
  };

});
