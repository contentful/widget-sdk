'use strict';

angular.module('contentful').controller('PermissionController', ['$scope', '$injector', function PermissionController($scope, $injector) {

  var $rootScope    = $injector.get('$rootScope');
  var stringUtils   = $injector.get('stringUtils');
  var enforcements  = $injector.get('enforcements');
  var authorization = $injector.get('authorization');
  var reasonsDenied = $injector.get('reasonsDenied');

  var actionsForEntities = {
    contentType: ['create', 'read', 'update', 'delete', 'publish', 'unpublish'],
    entry: ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
    asset: ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
    apiKey: ['create', 'read'],
    settings: ['update', 'read']
  };

  var controller = this;
  controller.entityActions = {};
  controller.initialize             = initialize;
  controller.get                    = getEntityActionPermission;
  controller.can                    = can;
  controller.canSelectOrg           = canSelectOrg;
  controller.canCreateSpace         = canCreateSpace;
  controller.canCreateSpaceInAnyOrg = canCreateSpaceInAnyOrg;
  controller.canCreateSpaceInOrg    = canCreateSpaceInOrg;

  function initialize(spaceContext) {
    controller.spaceContext = spaceContext;
    _.forEach(actionsForEntities, function (actions, entityName) {
      entityName = stringUtils.capitalizeFirst(entityName);
      _.forEach(actions, function (actionName) {
        var entityAction = actionName + entityName;
        controller.entityActions[entityAction] = can(actionName, entityName);
      });
    });
  }

  function getEntityActionPermission(label, permission) {
    var entityAction = controller.entityActions[label];
    return (entityAction && permission in entityAction) ? entityAction[permission] : false;
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
        checkForEnforcements.apply(null, arguments);
      }
    }
    return response;
  }

  function canSelectOrg(orgId) {
    var query = _.where($scope.user.organizationMemberships, {organization: {sys: {id: orgId}}});
    return query.length > 0 && (query[0].role == 'admin' || query[0].role == 'owner');
  }

  function canCreateSpace() {
    var response;
    if(authorization.authContext && $scope.organizations && $scope.organizations.length > 0){
      if(!canCreateSpaceInAnyOrg()) return false;

      response = authorization.authContext.can('create', 'Space');
      if(!response){
        checkForEnforcements('create', 'Space');
      }
    }
    return !!response;
  }

  function canCreateSpaceInAnyOrg() {
    return _.some($scope.organizations, function (org) {
      return canCreateSpaceInOrg(org.sys.id);
    });
  }

  function canCreateSpaceInOrg(orgId) {
    return authorization.authContext && authorization.authContext.organization(orgId).can('create', 'Space');
  }

  function checkForEnforcements() {
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

}]);
