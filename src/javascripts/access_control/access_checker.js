'use strict';

/**
 * @ngdoc service
 * @name accessChecker
 *
 * @description
 * This service exposes a variety of methods allowing you to check if you can
 * (or can't) do in the application.
 *
 * There are no setters. This __singleton__ service is watching for changes
 * that may change a state of user's permissions.
 */
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
      organization: spaceContext.getData('organization'),
      spaceMembership: spaceContext.getData('spaceMembership')
    };
  }, reset);

  return {
    /**
     * @ngdoc method
     * @name accessChecker#getResponses
     * @returns {object}
     * @description
     * Returns all collected worf responses.
     */
    getResponses: function () { return responses; },

    /**
     * @ngdoc method
     * @name accessChecker#getResponseByActionName
     * @returns {object}
     * @description
     * Returns worf response for a given action name.
     */
    getResponseByActionName: function (action) { return responses[action]; },

    /**
     * @ngdoc method
     * @name accessChecker#getSectionVisibility
     * @returns {object}
     * @description
     * Returns section visibility information.
     */
    getSectionVisibility: function () { return sectionVisibility; },

    /**
     * @ngdoc method
     * @name accessChecker#getUserQuota
     * @returns {object}
     * @description
     * Returns user quota information.
     */
    getUserQuota: function () { return userQuota; },

    /**
     * @ngdoc method
     * @name accessChecker#shouldHide
     * @param {string} actionName
     * @returns {boolean}
     * @description
     * Returns true if action with a given name should be hidden.
     */
    shouldHide: shouldHide,

    /**
     * @ngdoc method
     * @name accessChecker#shouldDisable
     * * @param {string} actionName
     * @returns {boolean}
     * @description
     * Returns true if action with a given name should be disabled.
     */
    shouldDisable: shouldDisable,

    reset:                           reset,
    getFieldChecker:                 getFieldChecker,
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

  /**
   * @ngdoc method
   * @name accessChecker#reset
   * @description
   * Forcibly recollect all permission data
   */
  function reset() {
    policyChecker.setMembership(spaceContext.getData('spaceMembership'));
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
    features        = spaceContext.getData('organization.subscriptionPlan.limits.features', {});
    userQuota.limit = spaceContext.getData('organization.subscriptionPlan.limits.permanent.organizationMembership', -1);
    userQuota.used  = spaceContext.getData('organization.usage.permanent.organizationMembership', 1);
  }

  /**
   * @ngdoc method
   * @name accessChecker#getFieldChecker
   * @param {API.Entry|API.Asset} entity
   * @param {function} predicate
   * @returns {object}
   * @description
   * Gets a field chcecker for a given entity.
   *
   * Predicate may be used to override field access check.
   */
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

  /**
   * @ngdoc method
   * @name accessChecker#canPerformActionOnEntryOfType
   * @param {string} action
   * @param {string} actionTypeId
   * @returns {boolean}
   * @description
   * Returns true if action can be performed on entry with the given content type ID.
   */
  function canPerformActionOnEntryOfType(action, contentTypeId) {
    if (action === 'create') {
      return !shouldHide('createEntry') || policyChecker.canCreateEntriesOfType(contentTypeId);
    } else {
      var entity = {data: {sys: {type: 'Entry', contentType: {sys: {id: contentTypeId}}}}};
      return canPerformActionOnEntity(action, entity);
    }
  }

  /**
   * @ngdoc method
   * @name accessChecker#canPerformActionOnEntity
   * @param {string} action
   * @param {API.Entry|API.Asset|string} entity
   * @returns {boolean}
   * @description
   * Returns true if action can be performed on entity.
   *
   * This method can be provided with an entity object or string `"Entry"` or `"Asset"`.
   */
  function canPerformActionOnEntity(action, entity) {
    return can(action, entity.data).can;
  }

  /**
   * @ngdoc method
   * @name accessChecker#canUpdateEntry
   * @param {API.Entry} entry
   * @returns {boolean}
   * @description
   * Returns true if an entry can be updated.
   */
  function canUpdateEntry(entry) {
    var canUpdate = canPerformActionOnEntity('update', entry);
    var ctId = getContentTypeIdFor(entry);
    var canUpdateThisType = policyChecker.canUpdateEntriesOfType(ctId);
    var canUpdateOwn = policyChecker.canUpdateOwnEntries();

    return canUpdate || canUpdateThisType || (canUpdateOwn && isAuthor(entry));
  }

  /**
   * @ngdoc method
   * @name accessChecker#canUpdateAsset
   * @param {API.Asset} asset
   * @returns {boolean}
   * @description
   * Returns true if an asset can be updated.
   */
  function canUpdateAsset(asset) {
    var canUpdate = canPerformActionOnEntity('update', asset);
    var canUpdateWithPolicy = policyChecker.canUpdateAssets();
    var canUpdateOwn = policyChecker.canUpdateOwnAssets();

    return canUpdate || canUpdateWithPolicy || (canUpdateOwn && isAuthor(asset));
  }

  function isAuthor(entity) {
    var author = getAuthorIdFor(entity);
    var currentUser = spaceContext.getData('spaceMembership.user.sys.id');

    return author === currentUser;
  }

  /**
   * @ngdoc method
   * @name accessChecker#canModifyApiKeys
   * @returns {boolean}
   * @description
   * Returns true if API Keys can be modified.
   */
  function canModifyApiKeys() {
    return dotty.get(responses, 'createApiKey.can', false);
  }

  /**
   * @ngdoc method
   * @name accessChecker#canModifyRoles
   * @returns {boolean}
   * @description
   * Returns true if Roles can be modified.
   */
  function canModifyRoles() {
    return isAdminOrOwner() && dotty.get(features, 'customRoles', false);
  }

  /**
   * @ngdoc method
   * @name accessChecker#canModifyUsers
   * @returns {boolean}
   * @description
   * Returns true if Users can be modified.
   */
  function canModifyUsers() {
    return isAdminOrOwner();
  }

  function isAdminOrOwner() {
    var isSpaceAdmin = spaceContext.getData('spaceMembership.admin', false);
    return isSpaceAdmin || _.contains(['owner', 'admin'], getRoleInOrganization());
  }

  /**
   * @ngdoc method
   * @name accessChecker#canCreateSpace
   * @returns {boolean}
   * @description
   * Returns true if space can be created.
   */
  function canCreateSpace() {
    if (OrganizationList.isEmpty()) { return false; }
    if (!authorization.authContext) { return false; }
    if (!canCreateSpaceInAnyOrganization()) { return false; }

    var response = checkIfCanCreateSpace(authorization.authContext);
    if (!response) { broadcastEnforcement(getEnforcement('create', 'Space')); }

    return response;
  }

  /**
   * @ngdoc method
   * @name accessChecker#canCreateSpaceInAnyOrganization
   * @returns {boolean}
   * @description
   * Returns true if space can be created in any organization.
   */
  function canCreateSpaceInAnyOrganization() {
    return _.some(OrganizationList.getAll(), function (org) {
      return canCreateSpaceInOrganization(org.sys.id);
    });
  }

  /**
   * @ngdoc method
   * @name accessChecker#canCreateSpaceInOrganization
   * @param {string} organizationId
   * @returns {boolean}
   * @description
   * Returns true if space can be created in an organization with a provided ID.
   */
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

  /**
   * @ngdoc method
   * @name accessChecker#wasForbidden
   * @param {object} context
   * @returns {function}
   * @description
   * Returns function that will check a status code of response.
   * If it's 403/4, it'll set "forbidden" key on a provided context object.
   */
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
    var organizationId = spaceContext.getData('organization.sys.id');
    var memberships    = spaceContext.getData('spaceMembership.user.organizationMemberships', []);
    var found          = null;

    if (organizationId && memberships.length > 0) {
      found = _.findWhere(memberships, {organization: {sys: {id: organizationId }}});
    }

    return dotty.get(found, 'role');
  }

  function getContentTypeIdFor(entry) {
    return dotty.get(entry, 'data.sys.contentType.sys.id');
  }

  function getAuthorIdFor(entry) {
    return dotty.get(entry, 'data.sys.createdBy.sys.id');
  }
}]);
