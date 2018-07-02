import {getSpaces, getOrganizations, getOrganization, user$} from 'services/TokenStore';
import { getStore } from 'TheStore';
import * as accessChecker from 'access_control/AccessChecker';
import {isOwnerOrAdmin} from 'services/OrganizationRoles';
import {getValue, onValue} from 'utils/kefir';
import {MODERN_STACK_ONBOARDING_SPACE_NAME, getStoragePrefix} from 'createModernOnboarding';
import {getKey as getSpaceAutoCreatedKey} from 'components/shared/auto_create_new_space';

const store = getStore();

function getUser () {
  // user$ is a property which starts with `null`
  // so it will never throw an error
  const user = getValue(user$);

  if (user) {
    return user;
  }

  return new Promise(resolve => {
    const off = onValue(user$, user => {
      if (user) {
        resolve(user);
        off();
      }
    });
  });
}

export function* getOnboardingSpaceId () {
  const [user, spaces] = yield Promise.all([
    getUser(),
    getSpaces()
  ]);
  const prefix = getStoragePrefix();

  const onboardingSpaceKey = `${prefix}:developerChoiceSpace`;
  const spaceId = store.get(onboardingSpaceKey);
  if (spaceId) {
    const spaceExist = spaces.some(space => space.sys.id === spaceId);

    if (spaceExist) {
      return spaceId;
    }
  }

  // try to find a space in all spaces with onboarding space name
  const onboardingSpace = spaces.find(space => space.name === MODERN_STACK_ONBOARDING_SPACE_NAME);

  if (onboardingSpace) {
    const onboardingSpaceId = onboardingSpace.sys.id;
    // mark space as a developer choice
    store.set(onboardingSpaceKey, onboardingSpaceId);
    // mark auto space creation as succeeded since space with
    // modern stack onboarding name exists
    store.set(getSpaceAutoCreatedKey(user, 'success'), true);

    return onboardingSpaceId;
  }
}

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
    return { orgId: lastUsedOrgId, org: usedOrg };
  } else {
    const { space } = yield* getSpaceInfo();
    return { orgId: space.organization.sys.id, org: space.organization };
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
