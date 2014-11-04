'use strict';

angular.module('contentful').controller('SpaceController',
  ['$scope', '$rootScope', 'analytics', 'routing', 'notification', 'authorization', 'enforcements', 'authentication', '$controller',
    function SpaceController($scope, $rootScope, analytics, routing, notification, authorization, enforcements, authentication, $controller) {

  $controller('UiConfigController', {$scope: $scope});

  $scope.$watch(function (scope) {
    if (scope.spaceContext && scope.spaceContext.space) {
      return _.map(scope.spaceContext.space.getPrivateLocales(), function (locale) {
        return locale.code;
      });
    }
  }, function (codes, old, scope) {
    if (codes) scope.spaceContext.refreshLocales();
  }, true);

  $scope.$watch('spaceContext.localeStates', function () {
    $scope.spaceContext.refreshActiveLocales();
  }, true);

  $scope.$watch('spaceContext', function(space, o, scope) {
    enforcements.setSpaceContext(scope.spaceContext);
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

  $scope.can = function (action, entity) {
    if (authorization.spaceContext){
      var response = entity && authorization.spaceContext.can.apply(authorization.spaceContext, arguments);
      if(!response){
        $scope.checkForEnforcements.apply($scope, arguments);
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

  function getEventSource(source) {
    return {
      addDropdown: 'Selected Add-Button',
      frameButton: 'Selected Add-Button in the Frame',
      frameLink: 'Selected Add-Link in the Frame'
    }[source];
  }


  function makeEntityResponseHandler(params) {
    return function entityResponseHandler(err, entity) {
      if (!err) {
        $scope.navigator[params.navigatorHandler](entity).goTo();
      } else {
        if(err && err.body && err.body.details && err.body.details.reasons){
          var enforcement = enforcements.determineEnforcement(
            err.body.details.reasons, params.entityType);
          if(enforcement){
            params.errorMessage = enforcement.tooltip || enforcement.message;
          }
        }
        notification.serverError(params.errorMessage, err);
      }
      analytics.track(getEventSource(params.source), {
        currentSection: $scope.spaceContext.tabList.currentSection(),
        currentViewType: $scope.spaceContext.tabList.currentViewType(),
        entityType: params.entityType,
        entitySubType: (typeof params.entitySubType == 'function') ?
          params.entitySubType(entity) : params.entitySubType
      });
    };
  }

  $scope.createEntry = function(contentType, source) {
    var handler = makeEntityResponseHandler({
      source: source,
      entityType: 'entry',
      entitySubType: contentType.getId(),
      navigatorHandler: 'entryEditor',
      errorMessage: 'Could not create Entry'
    });

    $scope.spaceContext.space.createEntry(contentType.getId(), {})
    .then(_.partial(handler, null), handler);
  };

  $scope.createAsset = function(source) {
    var handler = makeEntityResponseHandler({
      source: source,
      entityType: 'asset',
      entitySubType: function (entity) {
        return entity && entity.getId();
      },
      navigatorHandler: 'assetEditor',
      errorMessage: 'Could not create Asset'
    });
    var data = { sys: { type: 'Asset' }, fields: {} };

    $scope.spaceContext.space.createAsset(data)
    .then(_.partial(handler, null), handler);
  };

  $scope.createContentType = function(source) {
    var handler = makeEntityResponseHandler({
      source: source,
      entityType: 'contentType',
      navigatorHandler: 'contentTypeEditor',
      errorMessage: 'Could not create Content Type'
    });
    var data = { sys: {}, fields: [], name: '' };
    $scope.spaceContext.space.createContentType(data)
    .then(_.partial(handler, null), handler);
  };

  $scope.createApiKey = function(source) {
    var usage = enforcements.computeUsage('apiKey');
    if(usage){
      return notification.serverError(usage, {});
    }
    var apiKey = $scope.spaceContext.space.createBlankDeliveryApiKey();
    $scope.navigator.apiKeyEditor(apiKey).openAndGoTo();
    analytics.track(getEventSource(source), {
      currentSection: $scope.spaceContext.tabList.currentSection(),
      currentViewType: $scope.spaceContext.tabList.currentViewType(),
      entityType: 'apiKey'
    });
  };

}]);
