import {getSpace, getSpaces, getOrganization} from 'services/TokenStore';
import TheStore from 'TheStore';
import accessChecker from 'accessChecker';
import {isOwnerOrAdmin} from 'services/OrganizationRoles';

/**
 * @description get current space info
 * if there is no last used space in the store,
 * first available space is used
 */
export function* getSpaceInfo () {
  try {
    const spaceId = TheStore.get('lastUsedSpace');

    if (spaceId) {
      const space = yield getSpace(spaceId);
      return { space, spaceId };
    } else {
      throw new Error('no spaceId from the store');
    }
  } catch (e) {
    const rawSpace = yield getSpaces().then(spaces => spaces[0]);
    const space = yield getSpace(rawSpace.sys.id);
    return { space, spaceId: space.data.sys.id };
  }
}

/**
 * @description get current organization id
 * or organization of the first space
 */
export function* getOrg () {
  try {
    const orgId = TheStore.get('lastUsedOrg');

    if (orgId) {
      // will throw an error if org with such orgId does not exist
      yield getOrganization(orgId);
      return { orgId };
    } else {
      throw new Error('no orgId in the store');
    }
  } catch (e) {
    const { space } = yield* getSpaceInfo();

    return {
      orgId: space.getOrganizationId()
    };
  }
}

/**
 * @description check whether user can read API keys
 * we use {accessChecker}, and we use a sync method
 * it means that we need to initialize with space first,
 * using {spaceContext}, and only after you should
 * call this check
 */
export function checkSpaceApiAccess () {
  return accessChecker.canReadApiKeys();
}

/**
 * @description check whether user has access to organization
 * settings
 * @param {string} orgId - selected organization id
 * @return {boolean} - has access or not
 */
export function* checkOrgAccess (orgId) {
  const org = yield getOrganization(orgId);

  return isOwnerOrAdmin(org);
}
