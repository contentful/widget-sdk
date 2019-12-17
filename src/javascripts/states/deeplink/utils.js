import { getSpaces, getOrganizations, getOrganization, user$ } from 'services/TokenStore';
import { getStore } from 'browserStorage';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getValue, onValue } from 'utils/kefir';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { create as createSpaceEnvRepo } from 'data/CMA/SpaceEnvironmentsRepo';
import {
  MODERN_STACK_ONBOARDING_SPACE_NAME,
  getStoragePrefix
} from 'components/shared/auto_create_new_space/CreateModernOnboarding';
import { getSpaceAutoCreatedKey } from 'components/shared/auto_create_new_space/getSpaceAutoCreatedKey';
import { fetchMarketplaceApps } from 'app/Apps/MarketplaceClient';

function getUser() {
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

export async function getOnboardingSpaceId() {
  const store = getStore();

  const [user, spaces] = await Promise.all([getUser(), getSpaces()]);
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
export async function getSpaceInfo() {
  const store = getStore();

  const lastUsedId = store.get('lastUsedSpace');
  const spaces = await getSpaces();

  if (spaces.length === 0) {
    throw new Error('user has no spaces');
  }

  const defaultSpace = spaces[0];
  const usedSpace = lastUsedId && spaces.find(space => space.sys.id === lastUsedId);
  const space = usedSpace || defaultSpace;

  return { space, spaces, spaceId: space.sys.id };
}

export async function getAllEnviroments(spaceId) {
  const spaceEndpoint = createSpaceEndpoint(spaceId, 'master');
  const spaceEnvRepo = createSpaceEnvRepo(spaceEndpoint);
  const { environments } = await spaceEnvRepo.getAll();

  return environments;
}

export async function getMarketplaceApps() {
  const apps = await fetchMarketplaceApps();

  return apps.reduce((acc, app) => ({ ...acc, [app.id]: app }), {});
}

/**
 * @description get current organization id
 * or organization of the first space
 */
export async function getOrg() {
  const store = getStore();

  const lastUsedOrgId = store.get('lastUsedOrg');
  const orgs = await getOrganizations();

  const usedOrg = lastUsedOrgId && orgs.find(org => org.sys.id === lastUsedOrgId);

  if (usedOrg) {
    return { orgId: lastUsedOrgId, org: usedOrg };
  } else {
    const { space } = await getSpaceInfo();
    return { orgId: space.organization.sys.id, org: space.organization };
  }
}

/**
 * @description check whether user has access to organization
 * settings
 * @param {string} orgId - selected organization id
 * @return {boolean} - has access or not
 */
export async function checkOrgAccess(orgId) {
  const org = await getOrganization(orgId);
  return isOwnerOrAdmin(org);
}
