'use strict';

angular.module('contentful').controller('EntityCreationController', ['$injector', '$scope', function EntityCreationController($injector, $scope) {

  var analytics    = $injector.get('analytics');
  var notification = $injector.get('notification');
  var logger       = $injector.get('logger');
  var enforcements = $injector.get('enforcements');

  var EVENT_NAME = 'Selected Add-Button in the Frame';

  this.newEntry = function(contentType) {
    var handler = makeEntityResponseHandler({
      entityType: 'entry',
      entitySubType: contentType.getId(),
      stateName: 'spaces.detail.entries.detail',
      stateParam: 'entryId',
      errorMessage: 'Could not create Entry'
    });

    $scope.spaceContext.space.createEntry(contentType.getId(), {})
    .then(_.partial(handler, null), handler);
  };

  this.newAsset = function() {
    var handler = makeEntityResponseHandler({
      entityType: 'asset',
      entitySubType: function (entity) {
        return entity && entity.getId();
      },
      stateName: 'spaces.detail.assets.detail',
      stateParam: 'assetId',
      errorMessage: 'Could not create Asset'
    });
    var data = { sys: { type: 'Asset' }, fields: {} };

    $scope.spaceContext.space.createAsset(data)
    .then(_.partial(handler, null), handler);
  };

  this.newContentType = function() {
    $scope.$state.go('spaces.detail.content_types.new');
    /**
     * @ngdoc analytics-event
     * @name Clicked Add Content Type Button
     */
    analytics.track('Clicked Add Content Type Button');
  };

  this.newApiKey = function() {
    var usage = enforcements.computeUsage('apiKey');
    if(usage){
      return notification.error(usage);
    }
    $scope.$state.go('spaces.detail.api.keys.new');
    analytics.track(EVENT_NAME, {
      currentState: $scope.$state.current.name,
      entityType: 'apiKey'
    });
  };


  function makeEntityResponseHandler(params) {
    return function entityResponseHandler(err, entity) {
      var stateParams = {};
      if (!err) {
        stateParams[params.stateParam] = entity.getId();
        $scope.$state.go(params.stateName, stateParams);
      } else {
        if(dotty.get(err, 'body.details.reasons')){
          var enforcement = enforcements.determineEnforcement(
            err.body.details.reasons, params.entityType);
          if(enforcement){
            params.errorMessage = enforcement.tooltip || enforcement.message;
          }
        }
        logger.logServerWarn(params.errorMessage, {error: err });
        notification.error(params.errorMessage);
      }
      analytics.track(EVENT_NAME, {
        currentState: $scope.$state.current.name,
        entityType: params.entityType,
        entitySubType: (typeof params.entitySubType == 'function') ?
          params.entitySubType(entity) : params.entitySubType
      });
    };
  }

}]);
