import {getSpaces, getOrganizations, getOrganization} from 'services/TokenStore';
import { getStore } from 'TheStore';
import * as accessChecker from 'access_control/AccessChecker';
import {isOwnerOrAdmin} from 'services/OrganizationRoles';

const store = getStore();

/**
 * @description get current space info
 * if there is no last used space in the store,
 * first available space is used
 */
export function* getSpaceInfo () {
  const lastUsedId = store.get('lastUsedSpace');
  const spaces = yield getSpaces();

  if (spaces.length === 0) {
    throw new Error('user has no spaces');
  }

  const defaultSpace = spaces[0];
  const usedSpace = lastUsedId && spaces.find(space => space.sys.id === lastUsedId);
  const space = usedSpace || defaultSpace;

  return { space, spaceId: space.sys.id };
}

/**
 * @description get current organization id
 * or organization of the first space
 */
export function* getOrg () {
  const lastUsedOrgId = store.get('lastUsedOrg');
  const orgs = yield getOrganizations();

  const usedOrg = lastUsedOrgId && orgs.find(org => org.sys.id === lastUsedOrgId);

  if (usedOrg) {
    return { orgId: lastUsedOrgId };
  } else {
    const { space } = yield* getSpaceInfo();
    return { orgId: space.organization.sys.id };
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
