'use strict';

angular.module('contentful').controller('EntityCreationController', ['$injector', '$scope', function EntityCreationController($injector, $scope) {

  var analytics    = $injector.get('analytics');
  var notification = $injector.get('notification');
  var logger       = $injector.get('logger');
  var enforcements = $injector.get('enforcements');

  this.newEntry = function(contentType, source) {
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

  this.newAsset = function(source) {
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

  this.newContentType = function(source) {
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

  this.newApiKey = function(source) {
    var usage = enforcements.computeUsage('apiKey');
    if(usage){
      logger.logServerError(usage);
      return notification.error(usage);
    }
    var apiKey = $scope.spaceContext.space.newDeliveryApiKey();
    $scope.navigator.apiKeyEditor(apiKey).openAndGoTo();
    analytics.track(getEventSource(source), {
      currentSection: $scope.spaceContext.tabList.currentSection(),
      currentViewType: $scope.spaceContext.tabList.currentViewType(),
      entityType: 'apiKey'
    });
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
        logger.logServerError(params.errorMessage, {error: err });
        notification.error(params.errorMessage);
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

}]);
