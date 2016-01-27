'use strict';

angular.module('contentful').factory('accessChecker', ['$injector', function ($injector) {

  var $rootScope       = $injector.get('$rootScope');
  var $q               = $injector.get('$q');
  var stringUtils      = $injector.get('stringUtils');
  var enforcements     = $injector.get('enforcements');
  var authorization    = $injector.get('authorization');
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
      organization: fromSpaceData('organization'),
      spaceMembership: fromSpaceData('spaceMembership')
    };
  }, reset);

  return {
    reset:                           reset,
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
    canModifyApiKeys:                canModifyApiKeys,
    canModifyRoles:                  canModifyRoles,
    canModifyUsers:                  canModifyUsers,
    canCreateSpace:                  canCreateSpace,
    canCreateSpaceInAnyOrganization: canCreateSpaceInAnyOrganization,
    canCreateSpaceInOrganization:    canCreateSpaceInOrganization,
    wasForbidden:                    wasForbidden
  };

  function reset() {
    policyChecker.setMembership(fromSpaceData('spaceMembership'));
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
    features        = fromSpaceData('organization.subscriptionPlan.limits.features', {});
    userQuota.limit = fromSpaceData('organization.subscriptionPlan.limits.permanent.organizationMembership', -1);
    userQuota.used  = fromSpaceData('organization.usage.permanent.organizationMembership', 1);
  }

  function getFieldChecker(entity, predicate) {
    return policyChecker.getFieldChecker(getContentTypeIdFor(entity), predicate);
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
    if (action === 'create') {
      return !shouldHide('createEntry') || policyChecker.canCreateEntriesOfType(contentTypeId);
    } else {
      var entity = {data: {sys: {type: 'Entry', contentType: {sys: {id: contentTypeId}}}}};
      return canPerformActionOnEntity(action, entity);
    }
  }

  function canPerformActionOnEntity(action, entity) {
    return can(action, entity.data).can;
  }

  function canUpdateEntry(entry) {
    var canUpdate = canPerformActionOnEntity('update', entry);
    var ctId = getContentTypeIdFor(entry);
    var canUpdateThisType = policyChecker.canUpdateEntriesOfType(ctId);
    var canUpdateOwn = policyChecker.canUpdateOwnEntries();
    var isAuthor = false;

    if (canUpdateOwn) {
      var entryAuthor = getAuthorIdFor(entry);
      var currentUser = fromSpaceData('spaceMembership.user.sys.id');
      isAuthor = entryAuthor === currentUser;
    }

    return canUpdate || canUpdateThisType || (canUpdateOwn && isAuthor);
  }

  function canUpdateAsset(asset) {
    var canUpdate = canPerformActionOnEntity('update', asset);
    var canUpdateWithPolicy = policyChecker.canUpdateAssets();

    return canUpdate || canUpdateWithPolicy;
  }

  function canModifyApiKeys() {
    return dotty.get(responses, 'createApiKey.can', false);
  }

  function canModifyRoles() {
    return isAdminOrOwner() && dotty.get(features, 'customRoles', false);
  }

  function canModifyUsers() {
    return isAdminOrOwner();
  }

  function isAdminOrOwner() {
    var isSpaceAdmin = fromSpaceData('spaceMembership.admin', false);
    return isSpaceAdmin || _.contains(['owner', 'admin'], getRoleInOrganization());
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

  function getRoleInOrganization() {
    var organizationId = fromSpaceData('organization.sys.id');
    var memberships    = fromSpaceData('spaceMembership.user.organizationMemberships', []);
    var found          = null;

    if (organizationId && memberships.length > 0) {
      found = _.findWhere(memberships, {organization: {sys: {id: organizationId }}});
    }

    return dotty.get(found, 'role');
  }

  function fromSpaceData(path, defaultValue) {
    var data = dotty.get(spaceContext, 'space.data', {});
    return dotty.get(data, path, defaultValue);
  }

  function getContentTypeIdFor(entry) {
    return dotty.get(entry, 'data.sys.contentType.sys.id');
  }

  function getAuthorIdFor(entry) {
    return dotty.get(entry, 'data.sys.createdBy.sys.id');
  }
}]);
