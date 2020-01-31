import { makeSum } from 'sum-types';
import { startsWith } from 'lodash';
import * as K from 'utils/kefir';
import { getOrganization } from 'services/TokenStore';
import { getStore } from 'browserStorage';
const store = getStore();

/**
 * Possible app states for navigation (as shown in sidepanel)
 */
export const NavStates = makeSum({
  Space: ['space', 'env', 'org', 'availableEnvironments', 'environmentMeta'],
  OrgSettings: ['org'],
  UserProfile: ['org'],
  Home: ['org'],
  NewOrg: [],
  Default: []
});

const navStateBus = K.createPropertyBus(NavStates.Default());

// Current navigation state property
export const navState$ = navStateBus.property;

/**
 * Updates navState$ based on ui router state, state params and spaceContext instance.
 * @param {ui.router.state.State} state - ui state
 * @param {object} params - ui state params
 * @param {spaceContext} spaceContext
 */
export async function updateNavState(state, params, { space, organization, environments }) {
  if (state.name === 'account.new_organization') {
    navStateBus.set(NavStates.NewOrg());
  } else if (startsWith(state.name, 'account.profile')) {
    const orgId = store.get('lastUsedOrg');
    getOrganization(orgId).then(org => {
      navStateBus.set(NavStates.UserProfile(org));
    });
  } else if (startsWith(state.name, 'account.organizations') && params.orgId) {
    getOrganization(params.orgId).then(org => {
      navStateBus.set(NavStates.OrgSettings(org));
    });
  } else if (space) {
    const { data, environment, environmentMeta } = space;
    navStateBus.set(
      NavStates.Space(data, environment, organization, environments, environmentMeta)
    );
  } else if (state.name === 'home' && params.orgId) {
    getOrganization(params.orgId).then(org => {
      navStateBus.set(NavStates.Home(org));
    });
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
