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
angular.module('contentful').factory('accessChecker', ['require', function (require) {
  var $rootScope = require('$rootScope');
  var $q = require('$q');
  var stringUtils = require('stringUtils');
  var authorization = require('authorization');
  var logger = require('logger');
  var OrganizationRoles = require('services/OrganizationRoles');
  var TokenStore = require('services/TokenStore');
  var K = require('utils/kefir');
  var policyChecker = require('accessChecker/policy');
  var cache = require('accessChecker/responseCache');
  var capitalize = require('stringUtils').capitalize;

  var ACTIONS_FOR_ENTITIES = {
    contentType: ['create', 'read', 'update', 'delete', 'publish', 'unpublish'],
    entry: ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
    asset: ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
    apiKey: ['create', 'read'],
    settings: ['update', 'read']
  };

  var shouldHide = createResponseAttributeGetter('shouldHide');
  var shouldDisable = createResponseAttributeGetter('shouldDisable');
  var responses = {};
  var features = {};
  var userQuota = {};
  var sectionVisibility = {};

  var isInitializedBus = K.createPropertyBus(false);

  $rootScope.$watchCollection(function () {
    return {
      authContext: authorization.authContext,
      spaceContext: authorization.spaceContext,
      organization: getSpaceData('organization'),
      spaceMembership: getSpaceData('spaceMembership')
    };
  }, reset);

  return {
    isInitialized$: isInitializedBus.property.skipDuplicates(),
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
     * Returns true if the user is not allowed to perform the given
     * action and the ACLs does not provide a reason why. If the ACLs
     * give a reason this is false but `shouldDisable` is true.
     */
    shouldHide: shouldHide,

    /**
     * @ngdoc method
     * @name accessChecker#shouldDisable
     * @param {string} actionName
     * @returns {boolean}
     * @description
     * Returns true if the user is not allowed to perform the given
     * action and the ACLs provide a reason why. If the ACLs give no
     * reason then this is false but `shouldHide` is true.
     */
    shouldDisable: shouldDisable,

    /**
     * @ngdoc method
     * @name accessChecker#can
     * @param {string} action
     * @param {string} entityType
     * @returns {boolean}
     * @description
     * Returns true if the user is allowed to perform `action` on
     * entities of type `entityType`.
     *
     * See the definition of `ACTIONS_FOR_ENTITIES` above for a list of
     * actions and entity types. Note that entity types should be
     * provided in camel case
     */
    can: function (action, entityType) {
      return getPermissions(action, entityType).can;
    },

    reset: reset,
    canPerformActionOnEntity: canPerformActionOnEntity,
    canPerformActionOnEntryOfType: canPerformActionOnEntryOfType,
    canUpdateEntry: canUpdateEntry,
    canUpdateAsset: canUpdateAsset,
    canUpdateEntity: canUpdateEntity,
    canUploadMultipleAssets: canUploadMultipleAssets,
    canReadApiKeys: canReadApiKeys,
    canModifyApiKeys: canModifyApiKeys,
    canModifyRoles: canModifyRoles,
    canModifyUsers: canModifyUsers,
    canCreateSpace: canCreateSpace,
    canCreateSpaceInAnyOrganization: canCreateSpaceInAnyOrganization,
    canCreateSpaceInOrganization: canCreateSpaceInOrganization,
    canCreateOrganization: canCreateOrganization,
    wasForbidden: wasForbidden
  };

  /**
   * @ngdoc method
   * @name accessChecker#reset
   * @description
   * Forcibly recollect all permission data
   */
  function reset () {
    cache.reset(authorization.spaceContext);
    policyChecker.setMembership(getSpaceData('spaceMembership'));
    collectResponses();
    collectFeatures();
    collectSectionVisibility();

    isInitializedBus.set(!!authorization.authContext);
  }

  function collectResponses () {
    var replacement = {};

    _.forEach(ACTIONS_FOR_ENTITIES, function (actions, entity) {
      entity = stringUtils.capitalizeFirst(entity);
      _.forEach(actions, function (action) {
        replacement[action + entity] = getPermissions(action, entity);
      });
    });

    responses = replacement;
  }

  function collectSectionVisibility () {
    sectionVisibility = {
      contentType: !shouldHide('updateContentType') || !shouldHide('readApiKey'),
      entry: !shouldHide('readEntry') || policyChecker.canAccessEntries(),
      asset: !shouldHide('readAsset') || policyChecker.canAccessAssets(),
      apiKey: !shouldHide('readApiKey'),
      settings: !shouldHide('updateSettings'),
      spaceHome: getSpaceData('spaceMembership.admin', false)
    };
  }

  function collectFeatures () {
    features = getSpaceData('organization.subscriptionPlan.limits.features', {});
    userQuota.limit = getSpaceData('organization.subscriptionPlan.limits.permanent.organizationMembership', -1);
    userQuota.used = getSpaceData('organization.usage.permanent.organizationMembership', 1);
  }

  function createResponseAttributeGetter (attrName) {
    return function (actionName) {
      var action = responses[actionName];
      return (action && attrName in action) ? action[attrName] : false;
    };
  }

  function getPermissions (action, entity) {
    var response = { shouldHide: false, shouldDisable: false };

    if (!authorization.spaceContext) { return response; }
    response.can = cache.getResponse(action, entity);
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
   * @param {string} ctId
   * @returns {boolean}
   * @description
   * Returns true if action can be performed on entry with the given content type ID.
   */
  function canPerformActionOnEntryOfType (action, ctId) {
    var entity = {data: {sys: {type: 'Entry', contentType: {sys: {id: ctId}}}}};
    return canPerformActionOnEntity(action, entity);
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
  function canPerformActionOnEntity (action, entity) {
    return getPermissions(action, entity.data).can;
  }

  function canPerformActionOnType (action, type) {
    return getPermissions(action, capitalize(type)).can;
  }

  /**
   * @ngdoc method
   * @name accessChecker#canUpdateEntry
   * @param {Client.Entry} entry
   * @returns {boolean}
   * @description
   * Returns true if an entry can be updated.
   */
  function canUpdateEntry (entry) {
    var canUpdate = canPerformActionOnEntity('update', entry);
    var ctId = getContentTypeIdFor(entry);
    var canUpdateThisType = policyChecker.canUpdateEntriesOfType(ctId);
    var canUpdateOwn = policyChecker.canUpdateOwnEntries();

    return canUpdate || canUpdateThisType || (canUpdateOwn && isAuthor(entry));
  }

  /**
   * @ngdoc method
   * @name accessChecker#canUpdateAsset
   * @param {Client.Asset} asset
   * @returns {boolean}
   * @description
   * Returns true if an asset can be updated.
   */
  function canUpdateAsset (asset) {
    var canUpdate = canPerformActionOnEntity('update', asset);
    var canUpdateWithPolicy = policyChecker.canUpdateAssets();
    var canUpdateOwn = policyChecker.canUpdateOwnAssets();

    return canUpdate || canUpdateWithPolicy || (canUpdateOwn && isAuthor(asset));
  }


  /**
   * @ngdoc method
   * @name accessChecker#canUpdateEntity
   * @param {Client.Entity} entity
   * @returns {boolean}
   * @description
   * Returns true if the entity can be updated.
   *
   * Dispatches to the entry or asset method based on
   * `entity.data.sys.type`.
   */
  function canUpdateEntity (entity) {
    var type = entity.data.sys.type;
    if (type === 'Entry') {
      return canUpdateEntry(entity);
    } else if (type === 'Asset') {
      return canUpdateAsset(entity);
    } else {
      throw new TypeError('Unknown entity type: ' + type);
    }
  }

  function isAuthor (entity) {
    var author = getAuthorIdFor(entity);
    var currentUser = getSpaceData('spaceMembership.user.sys.id');

    return author === currentUser;
  }

  /**
   * @ngdoc method
   * @name accessChecker#canUploadMultipleAssets
   * @returns {boolean}
   * @description
   * Returns true if multiple assets can be uploaded.
   */
  function canUploadMultipleAssets () {
    var canCreate = canPerformActionOnType('create', 'asset');
    var canUpdate = canPerformActionOnType('update', 'asset');
    var canUpdateWithPolicy = policyChecker.canUpdateAssets() || policyChecker.canUpdateOwnAssets();

    return canCreate && (canUpdate || canUpdateWithPolicy);
  }

  /**
   * @ngdoc method
   * @name accessChecker#canModifyApiKeys
   * @returns {boolean}
   * @description
   * Returns true if API Keys can be modified.
   */
  function canModifyApiKeys () {
    return _.get(responses, 'createApiKey.can', false);
  }

  /**
   * @name accessChecker#canReadApiKeys
   * @returns {boolean}
   * @description
   * Returns true if API Keys can be read.
   */
  function canReadApiKeys () {
    return _.get(responses, 'readApiKey.can', false);
  }

  /**
   * @ngdoc method
   * @name accessChecker#canModifyRoles
   * @returns {boolean}
   * @description
   * Returns true if Roles can be modified.
   */
  function canModifyRoles () {
    return isSuperUser() && _.get(features, 'customRoles', false);
  }

  /**
   * @ngdoc method
   * @name accessChecker#canModifyUsers
   * @returns {boolean}
   * @description
   * Returns true if Users can be modified.
   */
  function canModifyUsers () {
    return isSuperUser();
  }

  function isSuperUser () {
    var isSpaceAdmin = getSpaceData('spaceMembership.admin', false);
    var organization = getSpaceData('organization');
    var isOrganizationAdmin = OrganizationRoles.isAdmin(organization);
    var isOrganizationOwner = OrganizationRoles.isOwner(organization);

    return isSpaceAdmin || isOrganizationAdmin || isOrganizationOwner;
  }

  /**
   * @ngdoc method
   * @name accessChecker#canCreateSpace
   * @returns {boolean}
   * @description
   * Returns true if space can be created.
   */
  function canCreateSpace () {
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
  function canCreateSpaceInAnyOrganization () {
    var orgs = K.getValue(TokenStore.organizations$);
    return _.some(orgs, function (org) {
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
  function canCreateSpaceInOrganization (organizationId) {
    if (!authorization.authContext) { return false; }

    var authContext = authorization.authContext;
    if (authContext.hasOrganization(organizationId)) {
      return checkIfCanCreateSpace(authContext.organization(organizationId));
    } else {
      return false;
    }
  }

  function checkIfCanCreateSpace (context) {
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
   * @name accessChecker#canCreateOrganization
   * @returns {boolean}
   * @description
   * Returns true if current user can create a new organization.
   */
  function canCreateOrganization () {
    return _.get(K.getValue(TokenStore.user$), 'canCreateOrganization', false);
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
  function wasForbidden (context) {
    return function (res) {
      if (_.includes([403, 404], parseInt(_.get(res, 'statusCode'), 10))) {
        context.forbidden = true;
        return $q.resolve(context);
      } else {
        return $q.reject(res);
      }
    };
  }

  function broadcastEnforcement (enforcement) {
    if (enforcement) {
      $rootScope.$broadcast('persistentNotification', {
        message: enforcement.message,
        actionMessage: enforcement.actionMessage,
        action: enforcement.action
      });
    }
  }

  function getEnforcement (action, entity) {
    var reasonsDenied = getReasonsDenied(action, entity);
    var entityType = toType(entity);

    return determineEnforcement(reasonsDenied, entityType);
  }

  function toType (entity) {
    if (_.isString(entity)) {
      return entity;
    } else {
      return _.get(entity, 'sys.type', null);
    }
  }

  function getReasonsDenied (action, entity) {
    return authorization.spaceContext.reasonsDenied(action, entity);
  }

  function getContentTypeIdFor (entry) {
    return _.get(entry, 'data.sys.contentType.sys.id');
  }

  function getAuthorIdFor (entry) {
    return _.get(entry, 'data.sys.createdBy.sys.id');
  }

  function determineEnforcement (reasonsDenied, entityType) {
    // Prevent circular deps
    return require('enforcements').determineEnforcement(reasonsDenied, entityType);
  }

  function getSpaceData (path, defaultValue) {
    // Prevent circular deps
    return require('spaceContext').getData(path, defaultValue);
  }
}]);
