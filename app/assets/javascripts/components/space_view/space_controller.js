'use strict';

angular.module('contentful').controller('SpaceCtrl', function SpaceCtrl($scope, $rootScope, analytics, routing, notification, authorization, reasonsDenied, enforcements, authentication) {
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

  $scope.$watch(function () {
    return authorization.isUpdated(authentication.tokenLookup, $scope.spaceContext.space) && authentication.tokenLookup;
  }, function (updated) {
    if(updated) {
      var enforcement = enforcements.getPeriodUsage();
      if(enforcement) {
        $rootScope.$broadcast('persistentNotification', {
          message: enforcement.message,
          tooltipMessage: enforcement.description,
          actionMessage: enforcement.actionMessage,
          action: enforcement.action
        });
      }
    }
  });

  $scope.can = function () {
    if (authorization.spaceContext){
      var response = authorization.spaceContext.can.apply(authorization.spaceContext, arguments);
      if(!response){
        var enforcement = enforcements.determineEnforcement(reasonsDenied.apply(null, arguments), arguments[1]);
        if(enforcement) {
          $rootScope.$broadcast('persistentNotification', {
            message: enforcement.message,
            tooltipMessage: enforcement.description,
            actionMessage: enforcement.actionMessage,
            action: enforcement.action
          });
        }
      }
      return response;
    }
    return false;
  };

  $scope.logoClicked = function () {
    analytics.track('Clicked Logo');
  };

  $scope.broadcastFromSpace = function(){
    $scope.$broadcast.apply($scope, arguments);
  };

  function makeEntityResponseHandler(params) {
    return function entityResponseHandler(err, entity) {
      $scope.$apply(function (scope) {
        if (!err) {
          scope.navigator[params.navigatorHandler](entity).goTo();
        } else {
          if(err.body.details.reasons){
            var enforcement = enforcements.determineEnforcement(
              err.body.details.reasons, params.entityType);
            if(enforcement){
              params.errorMessage = enforcement.tooltip || enforcement.message;
            }
          }
          notification.serverError(params.errorMessage, err);
        }
      });
      analytics.track('Selected Add-Button', {
        currentSection: $scope.spaceContext.tabList.currentSection(),
        currentViewType: $scope.spaceContext.tabList.currentViewType(),
        entityType: params.entityType,
        entitySubType: (typeof params.entitySubType == 'function') ?
          params.entitySubType(entity) : params.entitySubType
      });
    };
  }

  $scope.createEntry = function(contentType) {
    var scope = this;
    scope.spaceContext.space.createEntry(
      contentType.getId(),
      {},
      makeEntityResponseHandler({
        entityType: 'entry',
        entitySubType: contentType.getId(),
        navigatorHandler: 'entryEditor',
        errorMessage: 'Could not create Entry'
      })
    );
  };

  $scope.createAsset = function() {
    var scope = this;
    var data = {
      sys: {
        type: 'Asset'
      },
      fields: {}
    };

    scope.spaceContext.space.createAsset(data, makeEntityResponseHandler({
      entityType: 'asset',
      entitySubType: function (entity) {
        return entity && entity.getId();
      },
      navigatorHandler: 'assetEditor',
      errorMessage: 'Could not create Asset'
    }));
  };

  $scope.createContentType = function() {
    var scope = this;
    var data = {
      sys: {},
      fields: [],
      name: ''
    };
    scope.spaceContext.space.createContentType(data, makeEntityResponseHandler({
      entityType: 'contentType',
      navigatorHandler: 'contentTypeEditor',
      errorMessage: 'Could not create Content Type'
    }));
  };

  $scope.createApiKey = function() {
    var scope = this;
    var usage = enforcements.computeUsage('apiKey');
    if(usage){
      return notification.serverError(usage, {});
    }
    var apiKey = scope.spaceContext.space.createBlankApiKey();
    scope.navigator.apiKeyEditor(apiKey).openAndGoTo();
    analytics.track('Selected Add-Button', {
      currentSection: scope.spaceContext.tabList.currentSection(),
      currentViewType: scope.spaceContext.tabList.currentViewType(),
      entityType: 'apiKey'
    });
  };

});
