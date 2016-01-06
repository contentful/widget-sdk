'use strict';

angular.module('contentful').factory('accessChecker', ['$injector', function ($injector) {

  var $rootScope       = $injector.get('$rootScope');
  var $q               = $injector.get('$q');
  var stringUtils      = $injector.get('stringUtils');
  var enforcements     = $injector.get('enforcements');
  var authorization    = $injector.get('authorization');
  var authentication   = $injector.get('authentication');
  var logger           = $injector.get('logger');
  var OrganizationList = $injector.get('OrganizationList');
  var spaceContext     = $injector.get('spaceContext');
  var policyChecker    = $injector.get('accessChecker/policy');

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
  var features          = {};
  var userQuota         = {};
  var sectionVisibility = {};

  $rootScope.$watchCollection(function () {
    return {
      authContext: authorization.spaceContext,
      tokenLookup: authentication.tokenLookup,
      currentRole: getCurrentRole()
    };
  }, reset);

  return {
    getResponses:                    function () { return responses; },
    getResponseByActionName:         function (action) { return responses[action]; },
    getSectionVisibility:            function () { return sectionVisibility; },
    getUserQuota:                    function () { return userQuota; },
    getFieldChecker:                 getFieldChecker,
    shouldHide:                      shouldHide,
    shouldDisable:                   shouldDisable,
    canPerformActionOnEntity:        canPerformActionOnEntity,
    canPerformActionOnEntryOfType:   canPerformActionOnEntryOfType,
    canUpdateEntry:                  canUpdateEntry,
    canUpdateAsset:                  canUpdateAsset,
    canModifyApiKeys:                function () { return dotty.get(responses, 'createApiKey.can', false); },
    canModifyRoles:                  function () { return dotty.get(features,  'customRoles',      false); },
    canCreateSpace:                  canCreateSpace,
    canCreateSpaceInAnyOrganization: canCreateSpaceInAnyOrganization,
    canCreateSpaceInOrganization:    canCreateSpaceInOrganization,
    wasForbidden:                    wasForbidden
  };

  function reset() {
    policyChecker.setRole(getCurrentRole());
    collectResponses();
    collectFeatures();
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
      entry:       !shouldHide('readEntry') || policyChecker.canAccessEntries(),
      asset:       !shouldHide('readAsset') || policyChecker.canAccessAssets(),
      apiKey:      !shouldHide('readApiKey'),
      settings:    !shouldHide('updateSettings')
    };
  }

  function collectFeatures() {
    var spaces = dotty.get(authentication, 'tokenLookup.spaces', []);
    var tokenLookupSpace = _.findWhere(spaces, {sys: {id: spaceContext.getId()}});

    features        = dotty.get(tokenLookupSpace, 'organization.subscriptionPlan.limits.features', {});
    userQuota.used  = dotty.get(tokenLookupSpace, 'organization.usage.permanent.organizationMembership', 1);
    userQuota.limit = dotty.get(tokenLookupSpace, 'organization.subscriptionPlan.limits.permanent.organizationMembership', -1);
  }

  function getFieldChecker(entity, predicate) {
    var type = dotty.get(entity, 'data.sys.type', 'Entry');

    return policyChecker.getFieldChecker({
      baseCanUpdateFn: canPerformActionOnEntity.bind(null, 'update', entity),
      predicate: predicate,
      type: type,
      contentTypeId: type === 'Entry' ? getContentTypeIdFor(entity) : null
    });
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

  function canPerformActionOnEntryOfType(action, contentTypeId) {
    var entity = {data: {sys: {type: 'Entry', contentType: {sys: {id: contentTypeId}}}}};

    return canPerformActionOnEntity(action, entity);
  }

  function canPerformActionOnEntity(action, entity) {
    return can(action, entity.data).can;
  }

  function canUpdateEntry(entry) {
    var canUpdate = canPerformActionOnEntity('update', entry);
    var ctId = getContentTypeIdFor(entry);
    var canUpdateWithPolicy = policyChecker.canUpdateEntriesOfType(ctId);

    return canUpdate || canUpdateWithPolicy;
  }

  function canUpdateAsset(asset) {
    var canUpdate = canPerformActionOnEntity('update', asset);
    var canUpdateWithPolicy = policyChecker.canUpdateAssets();

    return canUpdate || canUpdateWithPolicy;
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

  function wasForbidden(context) {
    return function (res) {
      if (_.contains([403, 404], parseInt(dotty.get(res, 'statusCode'), 10))) {
        context.forbidden = true;
        return $q.when(context);
      } else {
        return $q.reject(res);
      }
    };
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

  function getCurrentRole() {
    return _.first(dotty.get(spaceContext, 'space.data.spaceMembership.roles', []));
  }

  function getContentTypeIdFor(entry) {
    return dotty.get(entry, 'data.sys.contentType.sys.id');
  }
}]);
