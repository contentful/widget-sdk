'use strict';

angular.module('contentful').controller('PermissionController', ['$scope', '$injector', function PermissionController($scope, $injector) {

  var stringUtils = $injector.get('stringUtils');

  var actionsForEntities = {
    contentType: ['create', 'read', 'update', 'delete', 'publish', 'unpublish'],
    entry: ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
    asset: ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
    apiKey: ['create', 'read'],
    settings: ['update', 'read']
  };

  var controller = this;
  controller.initialize = initialize;
  controller.can = can;

  function initialize(spaceContext) {
    controller.spaceContext = spaceContext;
    _.forEach(actionsForEntities, function (actions, entityName) {
      entityName = stringUtils.capitalizeFirst(entityName);
      _.forEach(actions, function (actionName) {
        var entityAction = actionName + entityName;
        controller[entityAction] = can(actionName, entityName);
      });
    });
  }

  function can(action, entity) {
    var response = {
      action: action,
      entity: entity,
      shouldHide: false,
      shouldDisable: false
    };

    if (entity && controller.spaceContext){
      response.can = controller.spaceContext.can.apply(controller.spaceContext, arguments);
      if(!response.can){
        var reasons = controller.spaceContext.reasonsDenied.apply(controller.spaceContext, arguments);
        response.reasons = reasons && reasons.length > 0 ? reasons : null;
        response.shouldDisable = !!response.reasons;
        response.shouldHide = !response.shouldDisable;
        $scope.checkForEnforcements.apply($scope, arguments);
      }
    }
    return response;
  }

}]);
