import logger from 'logger';
import * as TokenStore from 'services/TokenStore';
import * as K from 'utils/kefir';
import * as policyChecker from './PolicyChecker';
import * as cache from './ResponseCache';
import {create as createGKPermissionChecker} from './GKPermissionChecker';
import {
  broadcastEnforcement,
  toType,
  getContentTypeIdFor,
  isAuthor
} from './Utils';
import {capitalize, capitalizeFirst} from 'stringUtils';
import {get, some, forEach} from 'lodash';
import * as Enforcements from 'access_control/Enforcements';

export {wasForbidden} from './Utils';


/**
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

let authContext;
let spaceAuthContext;
let space;
let gkPermissionChecker;
let responses = {};
let sectionVisibility = {};

K.onValue(isInitializedBus.property, function (value) {
  if (value) {
    cache.reset(spaceAuthContext);
    policyChecker.setMembership(get(space, 'spaceMembership'));
    gkPermissionChecker = createGKPermissionChecker(space);
    collectResponses();
    collectSectionVisibility();
  }
});

export const isInitialized$ = isInitializedBus.property.skipDuplicates();

/**
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
 * @name accessChecker#getResponses
 * @returns {object}
 * @description
 * Returns all collected worf responses.
 */
export const getResponses = () => responses;

/**
 * @name accessChecker#getResponseByActionName
 * @returns {object}
 * @description
 * Returns worf response for a given action name.
 */
export const getResponseByActionName = (action) => responses[action];

/**
 * @name accessChecker#getSectionVisibility
 * @returns {object}
 * @description
 * Returns section visibility information.
 */
export const getSectionVisibility = () => sectionVisibility;


/**
 * @name accessChecker#canEditFieldLocale
 * @param {string} contentTypeId
 * @param {object} field
 * @param {object} locale
 * @returns {boolean}
 */
export const canEditFieldLocale = policyChecker.canEditFieldLocale;

export const getUserQuota = wrapGKMethod('getUserQuota');
export const hasFeature = wrapGKMethod('hasFeature');
export const canModifyRoles = wrapGKMethod('canModifyRoles');
export const canModifyUsers = wrapGKMethod('canModifyUsers');
export const canCreateOrganization = wrapGKMethod('canCreateOrganization');

/**
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
 * @name accessChecker#setAuthContext
 * @description
 * Set new auth context and forcibly recollect all permission data
 *
 * @param {object} context - object containig two properties:
 *        {object?} authContext,
 *        {object?} spaceAuthToken
 */
export function setAuthContext (context) {
  authContext = context.authContext;
  spaceAuthContext = context.spaceAuthContext;
  isInitializedBus.set(!!(authContext && spaceAuthContext && space));
}

/**
 * @name accessChecker#setSpace
 * @description
 * Set new space data and forcibly recollect all permission data
 *
 * @param {object} newSpace - space data object
 */
export function setSpace (newSpace) {
  space = newSpace;
  isInitializedBus.set(!!(authContext && spaceAuthContext && space));
}

/**
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
 * @name accessChecker#canCreateSpace
 * @returns {boolean}
 * @description
 * Returns true if space can be created.
 */
export function canCreateSpace () {
  if (!authContext || !canCreateSpaceInAnyOrganization()) {
    return false;
  }

  const response = checkIfCanCreateSpace(authContext);
  if (!response) {
    broadcastEnforcement(getEnforcement('create', 'Space'));
  }

  return response;
}

/**
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
 * @name accessChecker#canCreateSpaceInOrganization
 * @param {string} organizationId
 * @returns {boolean}
 * @description
 * Returns true if space can be created in an organization with a provided ID.
 */
export function canCreateSpaceInOrganization (organizationId) {
  if (!authContext) { return false; }

  if (authContext.hasOrganization(organizationId)) {
    return checkIfCanCreateSpace(authContext.organization(organizationId));
  } else {
    return false;
  }
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
    spaceHome: get(space, 'spaceMembership.admin')
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

  if (!spaceAuthContext) { return response; }
  response.can = cache.getResponse(action, entity);
  if (response.can) { return response; }

  const reasons = spaceAuthContext.reasonsDenied(action, entity);
  response.reasons = (reasons && reasons.length > 0) ? reasons : null;
  response.enforcement = getEnforcement(action, entity);
  response.shouldDisable = !!response.reasons;
  response.shouldHide = !response.shouldDisable;

  broadcastEnforcement(response.enforcement);

  return response;
}

function getEnforcement (action, entity) {
  const reasonsDenied = spaceAuthContext.reasonsDenied(action, entity);
  const entityType = toType(entity);

  return determineEnforcement(reasonsDenied, entityType);
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

function determineEnforcement (reasonsDenied, entityType) {
  const org = get(space, 'organization');
  return Enforcements.determineEnforcement(org, reasonsDenied, entityType);
}

// Creates a function that invokes named method on gkPermissionChecker if it's
// initialized.
// Usage:
// export const getUserQuota = wrapGKMethod('getUserQuota');
function wrapGKMethod (name) {
  return function (...args) {
    if (gkPermissionChecker) {
      return gkPermissionChecker[name].apply(gkPermissionChecker, args);
    }
  };
}
