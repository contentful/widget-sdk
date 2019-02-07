import * as TokenStore from 'services/TokenStore.es6';
import * as K from 'utils/kefir.es6';
import * as policyChecker from './PolicyChecker.es6';
import * as cache from './ResponseCache.es6';
import { create as createGKPermissionChecker } from './GKPermissionChecker.es6';
import {
  broadcastEnforcement,
  resetEnforcements,
  toType,
  getContentTypeIdFor,
  isAuthor
} from './Utils.es6';
import { capitalize, capitalizeFirst } from 'utils/StringUtils.es6';
import { chain, get, set, some, forEach, values } from 'lodash';
import * as Enforcements from 'access_control/Enforcements.es6';
import * as logger from 'services/logger.es6';

export { wasForbidden } from './Utils.es6';

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

export const Action = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  PUBLISH: 'publish',
  UNPUBLISH: 'unpublish',
  ARCHIVE: 'archive',
  UNARCHIVE: 'unarchive',
  MANAGE: 'manage'
};

const ACTIONS_FOR_ENTITIES = {
  contentType: [
    Action.CREATE,
    Action.READ,
    Action.UPDATE,
    Action.DELETE,
    Action.PUBLISH,
    Action.UNPUBLISH
  ],
  entry: [
    Action.CREATE,
    Action.READ,
    Action.UPDATE,
    Action.DELETE,
    Action.PUBLISH,
    Action.UNPUBLISH,
    Action.ARCHIVE,
    Action.UNARCHIVE
  ],
  asset: [
    Action.CREATE,
    Action.READ,
    Action.UPDATE,
    Action.DELETE,
    Action.PUBLISH,
    Action.UNPUBLISH,
    Action.ARCHIVE,
    Action.UNARCHIVE
  ],
  apiKey: [Action.CREATE, Action.READ],
  settings: [Action.UPDATE, Action.READ]
};

const isInitializedBus = K.createPropertyBus(false);

let authContext;
let spaceAuthContext;
let space;
let organization;
let gkPermissionChecker;
let responses = {};
let sectionVisibility = {};

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
export const shouldHide = (action, entityType) => {
  // Explicitly hide if read permissions are denied, regardless of
  // shouldDisable.
  if (!isAllowed(Action.READ, entityType)) {
    return true;
  }

  return createResponseAttributeGetter('shouldHide')(action, entityType);
};

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
 * @name accessChecker#getResponseByActionAndEntity
 * @returns {object}
 * @description
 * Returns worf response for a given action name and entity.
 *
 * Sample usage: getResponseByActionAndEntity('create', 'entry')
 */
export const getResponseByActionAndEntity = (action, entityType) =>
  get(responses, [action, entityType]);

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
export function can(action, entityType) {
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
export function setAuthContext(context) {
  setContext({ ...context, space, organization });
}

/**
 * @name accessChecker#setSpace
 * @description
 * Set new space data and forcibly recollect all permission data
 *
 * @param {object} newSpace - space data object
 */
export function setSpace(newSpace) {
  setContext({
    space: newSpace,
    organization: get(newSpace, 'organization'),
    authContext,
    spaceAuthContext
  });
}

export function setOrganization(newOrganization) {
  setContext({
    space: null,
    organization: newOrganization,
    authContext,
    spaceAuthContext
  });
}

function setContext(context) {
  authContext = context.authContext;
  spaceAuthContext = context.spaceAuthContext;
  space = context.space;
  organization = context.organization;

  cache.reset(spaceAuthContext);
  policyChecker.setMembership(get(space, 'spaceMembership'), spaceAuthContext);
  gkPermissionChecker = createGKPermissionChecker({ space, organization });
  collectResponses();
  collectSectionVisibility();

  const hasReasonsDenied = value => value.reasons && value.reasons.length;
  const denied = chain(responses)
    .values()
    .flatMap(values)
    .filter(hasReasonsDenied)
    .value();

  resetEnforcements();

  if (denied.length) {
    // show the yellow notification bar if space has reached a limit
    denied.forEach(value => broadcastEnforcement(value.enforcement));
  }

  // Access checker is initialized when at least an auth context is set.
  // _Note:_ If `can...()` method is called on uninitialized access checker,
  // it will return false rather than throw an error. It will also return false
  // on org and space specific methods e.g. `canCreateContentType()` if space
  // and organization are not set.
  isInitializedBus.set(!!authContext);
}

/**
 * @name accessChecker#canPerformActionOnEntryOfType
 * @param {string} action
 * @param {string} ctId
 * @returns {boolean}
 * @description
 * Returns true if action can be performed on entry with the given content type ID.
 */
export function canPerformActionOnEntryOfType(action, ctId) {
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
 */
export function canPerformActionOnEntity(action, entity) {
  return getPermissions(action, entity.data).can;
}

/**
 * @name accessChecker#canUpdateEntry
 * @param {Client.Entry} entry
 * @returns {boolean}
 * @description
 * Returns true if an entry can be updated.
 */
export function canUpdateEntry(entry) {
  // Explicitly check if permission is denied for update on Entry first
  if (!isAllowed(Action.UPDATE, 'entry')) {
    return false;
  }

  const canUpdate = canPerformActionOnEntity(Action.UPDATE, entry);
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
export function canUpdateAsset(asset) {
  // Explicitly check if permission is denied for update on Asset first
  if (!isAllowed(Action.UPDATE, 'asset')) {
    return false;
  }

  const canUpdate = canPerformActionOnEntity(Action.UPDATE, asset);
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
export function canUpdateEntity(entity) {
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
 * @name accessChecker#canCreateAsset
 * @returns {boolean}
 * @description
 * Returns true if the user can create assets.
 */
export function canCreateAsset() {
  return canPerformActionOnType(Action.CREATE, 'asset');
}

/**
 * @name accessChecker#canUploadMultipleAssets
 * @returns {boolean}
 * @description
 * Returns true if multiple assets can be uploaded.
 */
export function canUploadMultipleAssets() {
  const canCreate = canPerformActionOnType(Action.CREATE, 'asset');
  const canUpdate = canPerformActionOnType(Action.UPDATE, 'asset');
  const canUpdateWithPolicy = policyChecker.canUpdateAssets() || policyChecker.canUpdateOwnAssets();

  return canCreate && (canUpdate || canUpdateWithPolicy);
}

/**
 * @name accessChecker#canModifyApiKeys
 * @returns {boolean}
 * @description
 * Returns true if API Keys can be modified.
 */
export function canModifyApiKeys() {
  return get(responses, 'create.apiKey.can', false);
}

/**
 * @name accessChecker#canReadApiKeys
 * @returns {boolean}
 * @description
 * Returns true if API Keys can be read.
 */
export function canReadApiKeys() {
  return get(responses, 'read.apiKey.can', false);
}
/**
 * @name accessChecker#canCreateSpace
 * @returns {boolean}
 * @description
 * Returns true if space can be created.
 */
export function canCreateSpace() {
  if (!authContext || !canCreateSpaceInAnyOrganization()) {
    return false;
  }

  const response = checkIfCanCreateSpace(authContext);
  if (!response) {
    broadcastEnforcement(getEnforcement(Action.CREATE, 'Space'));
  }

  return response;
}

/**
 * @name accessChecker#canCreateSpaceInAnyOrganization
 * @returns {boolean}
 * @description
 * Returns true if space can be created in any organization.
 */
export function canCreateSpaceInAnyOrganization() {
  const orgs = K.getValue(TokenStore.organizations$);
  return some(orgs, org => canCreateSpaceInOrganization(org.sys.id));
}

/**
 * @name accessChecker#canCreateSpaceInOrganization
 * @param {string} organizationId
 * @returns {boolean}
 * @description
 * Returns true if space can be created in an organization with a provided ID.
 */
export function canCreateSpaceInOrganization(organizationId) {
  if (!authContext) {
    return false;
  }

  if (authContext.hasOrganization(organizationId)) {
    return checkIfCanCreateSpace(authContext.organization(organizationId));
  } else {
    return false;
  }
}

function collectResponses() {
  const replacement = {};

  forEach(ACTIONS_FOR_ENTITIES, (actions, entity) => {
    const entityCapitalized = capitalizeFirst(entity);

    actions.forEach(action =>
      set(replacement, [action, entity], getPermissions(action, entityCapitalized))
    );
  });

  responses = replacement;
}

function collectSectionVisibility() {
  sectionVisibility = {
    contentType: can(Action.MANAGE, 'ContentType') || !shouldHide(Action.READ, 'apiKey'),
    entry: !shouldHide(Action.READ, 'entry') || policyChecker.canAccessEntries(),
    asset: !shouldHide(Action.READ, 'asset') || policyChecker.canAccessAssets(),
    apiKey: isAllowed(Action.READ, 'settings') && !shouldHide(Action.READ, 'apiKey'),
    settings: !shouldHide(Action.UPDATE, 'settings'),
    locales: !shouldHide(Action.UPDATE, 'settings'),
    extensions: !shouldHide(Action.UPDATE, 'settings'),
    users: !shouldHide(Action.UPDATE, 'settings'),
    roles: !shouldHide(Action.UPDATE, 'settings'),
    environments: isAllowed(Action.READ, 'settings') && can(Action.MANAGE, 'Environments'),
    usage: !shouldHide(Action.UPDATE, 'settings'),
    previews: !shouldHide(Action.UPDATE, 'settings'),
    webhooks: !shouldHide(Action.UPDATE, 'settings'),
    spaceHome:
      get(space, 'spaceMembership.admin') || isAuthorOrEditor(get(space, 'spaceMembership.roles')),
    apps: get(space, 'spaceMembership.admin')
  };
}

/**
 * Returns if the permission for `action` on `entityType` is not explicitly
 * denied.
 * @param  {string} action
 * @param  {string} entityType
 * @return {Boolean}
 */
function isAllowed(action, entityType) {
  if (!spaceAuthContext) {
    return true;
  }

  const entityTypeCapitalized = capitalizeFirst(entityType);
  return !spaceAuthContext.isPermissionDenied(action, entityTypeCapitalized);
}

function createResponseAttributeGetter(attrName) {
  return (actionName, entity) => {
    const action = get(responses, [actionName, entity]);
    return action && attrName in action ? action[attrName] : false;
  };
}

function getPermissions(action, entity) {
  const response = { shouldHide: false, shouldDisable: false };

  if (!spaceAuthContext) {
    return response;
  }
  response.can = cache.getResponse(action, entity);
  if (response.can) {
    return response;
  }

  const reasons = spaceAuthContext.reasonsDenied(action, entity);
  response.reasons = reasons && reasons.length > 0 ? reasons : null;
  response.enforcement = getEnforcement(action, entity);
  response.shouldDisable = !!response.reasons;
  response.shouldHide = !response.shouldDisable;

  return response;
}

function getEnforcement(action, entity) {
  const reasonsDenied = spaceAuthContext.reasonsDenied(action, entity);
  const entityType = toType(entity);

  return determineEnforcement(reasonsDenied, entityType);
}

function canPerformActionOnType(action, type) {
  return getPermissions(action, capitalize(type)).can;
}

function checkIfCanCreateSpace(context) {
  let response = false;
  try {
    response = context.can(Action.CREATE, 'Space');
  } catch (e) {
    logger.logError('Worf exception - can create new space?', e);
  }
  return response;
}

function determineEnforcement(reasonsDenied, entityType) {
  return Enforcements.determineEnforcement(space, reasonsDenied, entityType);
}

// Creates a function that invokes named method on gkPermissionChecker if it's
// initialized.
// Usage:
// export const getUserQuota = wrapGKMethod('getUserQuota');
function wrapGKMethod(name) {
  return (...args) => {
    if (gkPermissionChecker) {
      return gkPermissionChecker[name](...args);
    }
  };
}

export function isAuthorOrEditor(roles) {
  return Boolean(
    roles && roles.findIndex(role => role.name === 'Author' || role.name === 'Editor') >= 0
  );
}
