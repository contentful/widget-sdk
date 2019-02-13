import { makeSum } from 'sum-types';
import { startsWith, get } from 'lodash';
import * as K from 'utils/kefir.es6';
import { getOrganization, getOrganizations } from 'services/TokenStore.es6';
import { getStore } from 'TheStore/index.es6';

const store = getStore();

/**
 * Possible app states for navigation (as shown in sidepanel)
 */
export const NavStates = makeSum({
  Space: ['space', 'env', 'org', 'availableEnvironments'],
  OrgSettings: ['org'],
  UserProfile: ['org'],
  NewOrg: ['org'],
  Default: []
});

const navStateBus = K.createPropertyBus(NavStates.Default());

async function getLastUsedOrg() {
  const lastUsedOrgId = store.get('lastUsedOrg');

  if (lastUsedOrgId) {
    return getOrganization(lastUsedOrgId);
  } else {
    const allOrgs = await getOrganizations();
    return get(allOrgs, 0, null);
  }
}

// Current navigation state property
export const navState$ = navStateBus.property;

/**
 * Updates navState$ based on ui router state, state params and spaceContext instance.
 * @param {ui.router.state.State} state - ui state
 * @param {object} params - ui state params
 * @param {spaceContext} spaceContext
 */
export async function updateNavState(state, params, spaceContext) {
  if (state.name === 'account.organizations.new') {
    const org = await getLastUsedOrg();
    navStateBus.set(NavStates.NewOrg(org));
  } else if (startsWith(state.name, 'account.profile')) {
    const org = await getLastUsedOrg();
    navStateBus.set(NavStates.UserProfile(org));
  } else if (startsWith(state.name, 'account.organizations') && params.orgId) {
    getOrganization(params.orgId).then(org => {
      navStateBus.set(NavStates.OrgSettings(org));
    });
  } else if (spaceContext.space) {
    const space = spaceContext.space.data;
    const env = spaceContext.space.environment;
    const org = spaceContext.organization;
    const availableEnvironments = spaceContext.environments;
    navStateBus.set(NavStates.Space(space, env, org, availableEnvironments));
  } else {
    navStateBus.set(NavStates.Default());
  }
}

/**
 * Makes a navState refresher function bound to $state and spaceContext
 * @param {ui.router.$state} $state
 * @param {spaceContext} spaceContext
 * @returns {function(): void}
 */
export const makeStateRefresher = ($state, spaceContext) => () =>
  updateNavState($state.current, $state.params, spaceContext);
