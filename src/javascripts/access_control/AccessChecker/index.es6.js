import $rootScope from '$rootScope';
import $q from '$q';
import authorization from 'authorization';
import logger from 'logger';
import * as OrganizationRoles from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import * as K from 'utils/kefir';
import * as policyChecker from './PolicyChecker';
import * as cache from './ResponseCache';
import {capitalize, capitalizeFirst} from 'stringUtils';
import {get, some, includes, forEach, isString} from 'lodash';
import require from 'require';

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

const ACTIONS_FOR_ENTITIES = {
  contentType: ['create', 'read', 'update', 'delete', 'publish', 'unpublish'],
  entry: ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
  asset: ['create', 'read', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
  apiKey: ['create', 'read'],
  settings: ['update', 'read']
};

const isInitializedBus = K.createPropertyBus(false);

let responses = {};
let features = {};
let userQuota = {};
let sectionVisibility = {};

export const isInitialized$ = isInitializedBus.property.skipDuplicates();

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
export const shouldHide = createResponseAttributeGetter('shouldHide');

/**
 * @ngdoc method
 * @name accessChecker#shouldDisable
 * @param {string} actionName
 * @returns {boolean}
 * @descrip§tion
 * Returns true if the user is not allowed to perform the given
 * action and the ACLs provide a reason why. If the ACLs give no
 * reason then this is false but `shouldHide` is true.
 */
export const shouldDisable = createResponseAttributeGetter('shouldDisable');

/**
 * @ngdoc method
 * @name accessChecker#getResponses
 * @returns {object}
 * @description
 * Returns all collected worf responses.
 */
export const getResponses = () => responses;

/**
 * @ngdoc method
 * @name accessChecker#getResponseByActionName
 * @returns {object}
 * @description
 * Returns worf response for a given action name.
 */
export const getResponseByActionName = (action) => responses[action];

/**
 * @ngdoc method
 * @name accessChecker#getSectionVisibility
 * @returns {object}
 * @description
 * Returns section visibility information.
 */
export const getSectionVisibility = () => sectionVisibility;

/**
 * @ngdoc method
 * @name accessChecker#getUserQuota
 * @returns {object}
 * @description
 * Returns user quota information.
 */
export const getUserQuota = () => userQuota;


/**
 * @name accessChecker#canEditFieldLocale
 * @param {string} contentTypeId
 * @param {object} field
 * @param {object} locale
 * @returns {boolean}
 */
export const canEditFieldLocale = policyChecker.canEditFieldLocale;

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
export function can (action, entityType) {
  return getPermissions(action, entityType).can;
}

/**
 * @ngdoc method
 * @name accessChecker#reset
 * @description
 * Forcibly recollect all permission data
 */
export function reset () {
  cache.reset(authorization.spaceContext);
  policyChecker.setMembership(getSpaceData('spaceMembership'));
  collectResponses();
  collectFeatures();
  collectSectionVisibility();

  isInitializedBus.set(!!authorization.authContext);
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
export function canPerformActionOnEntryOfType (action, ctId) {
  const entity = {
    data: {
      sys: {
        type: 'Entry',
        contentType: {
          sys: {
            id: ctId
          }
        }
      }
    }
  };
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
export function canPerformActionOnEntity (action, entity) {
  return getPermissions(action, entity.data).can;
}

/**
 * @ngdoc method
 * @name accessChecker#canUpdateEntry
 * @param {Client.Entry} entry
 * @returns {boolean}
 * @description
 * Returns true if an entry can be updated.
 */
export function canUpdateEntry (entry) {
  const canUpdate = canPerformActionOnEntity('update', entry);
  const ctId = getContentTypeIdFor(entry);
  const canUpdateThisType = policyChecker.canUpdateEntriesOfType(ctId);
  const canUpdateOwn = policyChecker.canUpdateOwnEntries();

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
export function canUpdateAsset (asset) {
  const canUpdate = canPerformActionOnEntity('update', asset);
  const canUpdateWithPolicy = policyChecker.canUpdateAssets();
  const canUpdateOwn = policyChecker.canUpdateOwnAssets();

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
export function canUpdateEntity (entity) {
  const type = entity.data.sys.type;
  if (type === 'Entry') {
    return canUpdateEntry(entity);
  } else if (type === 'Asset') {
    return canUpdateAsset(entity);
  } else {
    throw new TypeError('Unknown entity type: ' + type);
  }
}

/**
 * @ngdoc method
 * @name accessChecker#canUploadMultipleAssets
 * @returns {boolean}
 * @description
 * Returns true if multiple assets can be uploaded.
 */
export function canUploadMultipleAssets () {
  const canCreate = canPerformActionOnType('create', 'asset');
  const canUpdate = canPerformActionOnType('update', 'asset');
  const canUpdateWithPolicy = policyChecker.canUpdateAssets() || policyChecker.canUpdateOwnAssets();

  return canCreate && (canUpdate || canUpdateWithPolicy);
}

/**
 * @ngdoc method
 * @name accessChecker#canModifyApiKeys
 * @returns {boolean}
 * @description
 * Returns true if API Keys can be modified.
 */
export function canModifyApiKeys () {
  return get(responses, 'createApiKey.can', false);
}

/**
 * @name accessChecker#canReadApiKeys
 * @returns {boolean}
 * @description
 * Returns true if API Keys can be read.
 */
export function canReadApiKeys () {
  return get(responses, 'readApiKey.can', false);
}

/**
 * @ngdoc method
 * @name accessChecker#canModifyRoles
 * @returns {boolean}
 * @description
 * Returns true if Roles can be modified.
 */
export function canModifyRoles () {
  return isSuperUser() && get(features, 'customRoles', false);
}

/**
 * @ngdoc method
 * @name accessChecker#canModifyUsers
 * @returns {boolean}
 * @description
 * Returns true if Users can be modified.
 */
export function canModifyUsers () {
  return isSuperUser();
}

/**
 * @ngdoc method
 * @name accessChecker#canCreateSpace
 * @returns {boolean}
 * @description
 * Returns true if space can be created.
 */
export function canCreateSpace () {
  if (!authorization.authContext || !canCreateSpaceInAnyOrganization()) {
    return false;
  }

  const response = checkIfCanCreateSpace(authorization.authContext);
  if (!response) {
    broadcastEnforcement(getEnforcement('create', 'Space'));
  }

  return response;
}

/**
 * @ngdoc method
 * @name accessChecker#canCreateSpaceInAnyOrganization
 * @returns {boolean}
 * @description
 * Returns true if space can be created in any organization.
 */
export function canCreateSpaceInAnyOrganization () {
  const orgs = K.getValue(TokenStore.organizations$);
  return some(orgs, (org) => canCreateSpaceInOrganization(org.sys.id));
}

/**
 * @ngdoc method
 * @name accessChecker#canCreateSpaceInOrganization
 * @param {string} organizationId
 * @returns {boolean}
 * @description
 * Returns true if space can be created in an organization with a provided ID.
 */
export function canCreateSpaceInOrganization (organizationId) {
  if (!authorization.authContext) { return false; }

  const authContext = authorization.authContext;
  if (authContext.hasOrganization(organizationId)) {
    return checkIfCanCreateSpace(authContext.organization(organizationId));
  } else {
    return false;
  }
}


/**
 * @ngdoc method
 * @name accessChecker#canCreateOrganization
 * @returns {boolean}
 * @description
 * Returns true if current user can create a new organization.
 */
export function canCreateOrganization () {
  return get(K.getValue(TokenStore.user$), 'canCreateOrganization', false);
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
export function wasForbidden (context) {
  return function (res) {
    if (includes([403, 404], parseInt(get(res, 'statusCode'), 10))) {
      context.forbidden = true;
      return $q.resolve(context);
    } else {
      return $q.reject(res);
    }
  };
}

function collectResponses () {
  const replacement = {};

  forEach(ACTIONS_FOR_ENTITIES, (actions, entity) => {
    entity = capitalizeFirst(entity);
    actions.forEach((action) => {
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
  userQuota = {
    limit: getSpaceData('organization.subscriptionPlan.limits.permanent.organizationMembership', -1),
    used: getSpaceData('organization.usage.permanent.organizationMembership', 1)
  };
}

function createResponseAttributeGetter (attrName) {
  return function (actionName) {
    const action = responses[actionName];
    return (action && attrName in action) ? action[attrName] : false;
  };
}

function getPermissions (action, entity) {
  const response = { shouldHide: false, shouldDisable: false };

  if (!authorization.spaceContext) { return response; }
  response.can = cache.getResponse(action, entity);
  if (response.can) { return response; }

  const reasons = getReasonsDenied(action, entity);
  response.reasons = (reasons && reasons.length > 0) ? reasons : null;
  response.enforcement = getEnforcement(action, entity);
  response.shouldDisable = !!response.reasons;
  response.shouldHide = !response.shouldDisable;
  broadcastEnforcement(response.enforcement);

  return response;
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
  const reasonsDenied = getReasonsDenied(action, entity);
  const entityType = toType(entity);

  return determineEnforcement(reasonsDenied, entityType);
}

function toType (entity) {
  if (isString(entity)) {
    return entity;
  } else {
    return get(entity, 'sys.type', null);
  }
}

function getReasonsDenied (action, entity) {
  return authorization.spaceContext.reasonsDenied(action, entity);
}

function getContentTypeIdFor (entry) {
  return get(entry, 'data.sys.contentType.sys.id');
}

function getAuthorIdFor (entry) {
  return get(entry, 'data.sys.createdBy.sys.id');
}

function canPerformActionOnType (action, type) {
  return getPermissions(action, capitalize(type)).can;
}

function checkIfCanCreateSpace (context) {
  let response = false;
  try {
    response = context.can('create', 'Space');
  } catch (e) {
    logger.logError('Worf exception - can create new space?', e);
  }
  return response;
}

function isAuthor (entity) {
  const author = getAuthorIdFor(entity);
  const currentUserId = getSpaceData('spaceMembership.user.sys.id');

  return author === currentUserId;
}

function isSuperUser () {
  const isSpaceAdmin = getSpaceData('spaceMembership.admin', false);
  const organization = getSpaceData('organization');
  const isOrganizationAdmin = OrganizationRoles.isAdmin(organization);
  const isOrganizationOwner = OrganizationRoles.isOwner(organization);

  return isSpaceAdmin || isOrganizationAdmin || isOrganizationOwner;
}

function determineEnforcement (reasonsDenied, entityType) {
  // Prevent circular deps
  return require('access_control/Enforcements').determineEnforcement(reasonsDenied, entityType);
}

function getSpaceData (path, defaultValue) {
  // Prevent circular deps
  return require('spaceContext').getData(path, defaultValue);
}

$rootScope.$watchCollection(function () {
  return {
    authContext: authorization.authContext,
    spaceContext: authorization.spaceContext,
    organization: getSpaceData('organization'),
    spaceMembership: getSpaceData('spaceMembership')
  };
}, reset);
