import {makeSum} from 'libs/sum-types';
import {startsWith} from 'lodash';
import * as K from 'utils/kefir';
import {getOrganization} from 'services/TokenStore';

/**
 * Possible app states for navigation (as shown in sidepanel)
 */
export const NavStates = makeSum({
  Space: ['space', 'environment', 'organization', 'availableEnvironments'],
  OrgSettings: ['org'],
  UserProfile: [],
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
export function updateNavState (state, params, spaceContext) {
  if (state.name === 'account.organizations.new') {
    navStateBus.set(NavStates.NewOrg());
  } else if (startsWith(state.name, 'account.profile')) {
    navStateBus.set(NavStates.UserProfile());
  } else if (startsWith(state.name, 'account.organizations') && params.orgId) {
    getOrganization(params.orgId).then((org) => {
      navStateBus.set(NavStates.OrgSettings(org));
    });
  } else if (spaceContext.space) {
    const space = spaceContext.space.data;
    const env = spaceContext.space.environment;
    const org = spaceContext.organizationContext.organization;
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
