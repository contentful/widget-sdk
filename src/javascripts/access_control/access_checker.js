'use strict';

angular.module('contentful').factory('accessChecker', ['$injector', function ($injector) {

  var $rootScope       = $injector.get('$rootScope');
  var stringUtils      = $injector.get('stringUtils');
  var enforcements     = $injector.get('enforcements');
  var authorization    = $injector.get('authorization');
  var logger           = $injector.get('logger');
  var OrganizationList = $injector.get('OrganizationList');

  var ACTIONS_FOR_ENTITIES = {
    contentType: ['create', 'read', 'update', 'delete', 'publish', 'unpublish'],
    entry: ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
    asset: ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
    apiKey: ['create', 'read'],
    settings: ['update', 'read']
  };

  var shouldHide        = createResponseAttributeGetter('shouldHide');
  var shouldDisable     = createResponseAttributeGetter('shouldDisable');
  var responses         = {};
  var sectionVisibility = {};

  $rootScope.$watch(function () { return authorization.spaceContext; }, reset);

  return {
    getResponseByActionName:         function (action) { return responses[action]; },
    getSectionVisibility:            function () { return sectionVisibility; },
    shouldHide:                      shouldHide,
    shouldDisable:                   shouldDisable,
    canPerformActionOnEntity:        canPerformActionOnEntity,
    canCreateSpace:                  canCreateSpace,
    canCreateSpaceInAnyOrganization: canCreateSpaceInAnyOrganization,
    canCreateSpaceInOrganization:    canCreateSpaceInOrganization
  };

  function reset() {
    collectResponses();
    collectSectionVisibility();
  }

  function collectResponses() {
    var replacement = {};

    _.forEach(ACTIONS_FOR_ENTITIES, function (actions, entity) {
      entity = stringUtils.capitalizeFirst(entity);
      _.forEach(actions, function (action) {
        replacement[action + entity] = can(action, entity);
      });
    });

    responses = replacement;
  }

  function collectSectionVisibility() {
    sectionVisibility = {
      contentType: !shouldHide('updateContentType'),
      entry:       !shouldHide('readEntry'),
      asset:       !shouldHide('readAsset'),
      apiKey:      !shouldHide('readApiKey'),
      settings:    !shouldHide('updateSettings')
    };
  }

  function createResponseAttributeGetter(attrName) {
    return function (actionName) {
      var action = responses[actionName];
      return (action && attrName in action) ? action[attrName] : false;
    };
  }

  function can(action, entity) {
    var response = { shouldHide: false, shouldDisable: false };

    if (!authorization.spaceContext) { return response; }
    response.can = authorization.spaceContext.can(action, entity);
    if (response.can) { return response; }

    var reasons = getReasonsDenied(action, entity);
    response.reasons = (reasons && reasons.length > 0) ? reasons : null;
    response.enforcement = getEnforcement(action, entity);
    response.shouldDisable = !!response.reasons;
    response.shouldHide = !response.shouldDisable;
    broadcastEnforcement(response.enforcement);

    return response;
  }

  function canPerformActionOnEntity(action, entity) {
    return can(action, entity.data).can;
  }

  function canCreateSpace() {
    if (OrganizationList.isEmpty()) { return false; }
    if (!authorization.authContext) { return false; }
    if (!canCreateSpaceInAnyOrganization()) { return false; }

    var response = checkIfCanCreateSpace(authorization.authContext);
    if (!response) { broadcastEnforcement(getEnforcement('create', 'Space')); }

    return response;
  }

  function canCreateSpaceInAnyOrganization() {
    return _.some(OrganizationList.getAll(), function (org) {
      return canCreateSpaceInOrganization(org.sys.id);
    });
  }

  function canCreateSpaceInOrganization(organizationId) {
    if (!authorization.authContext) { return false; }

    return checkIfCanCreateSpace(authorization.authContext.organization(organizationId));
  }

  function checkIfCanCreateSpace(context) {
    var response = false;
    try {
      response = context.can('create', 'Space');
    } catch (e) {
      logger.logError('Worf exception - can create new space?', e);
    }
    return response;
  }

  function broadcastEnforcement(enforcement) {
    if (enforcement) {
      $rootScope.$broadcast('persistentNotification', {
        message: enforcement.message,
        actionMessage: enforcement.actionMessage,
        action: enforcement.action
      });
    }
  }

  function getEnforcement(action, entity) {
    return enforcements.determineEnforcement(getReasonsDenied(action, entity), entity);
  }

  function getReasonsDenied(action, entity) {
    return authorization.spaceContext.reasonsDenied(action, entity);
  }
}]);
