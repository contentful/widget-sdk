import {makeSum} from 'libs/sum-types';
import {startsWith} from 'lodash';
import * as $q from '$q';
import * as K from 'utils/kefir';
import {getOrganization} from 'services/TokenStore';

/**
 * Possible app states for navigation (as shown in sidepanel)
 */
export const NavStates = makeSum({
  Space: ['space', 'org'],
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
 * @param {Object} params - ui state params
 * @param {spaceContext} spaceContext
 */
export function updateNavState (state, params, spaceContext) {
  getNavState(state, params, spaceContext).then((state) => navStateBus.set(state));
}

function getNavState (state, params, spaceContext) {
  if (state.name === 'account.organizations.new') {
    return $q.resolve(NavStates.NewOrg());
  } else if (startsWith(state.name, 'account.profile')) {
    return $q.resolve(NavStates.UserProfile());
  } else if (startsWith(state.name, 'account.organizations') && params.orgId) {
    return getOrganization(params.orgId).then((org) => NavStates.OrgSettings(org));
  } else if (spaceContext.space) {
    const space = spaceContext.space.data;
    const org = spaceContext.organizationContext.organization;
    return $q.resolve(NavStates.Space(space, org));
  } else {
    return $q.resolve(NavStates.Default());
  }
}
