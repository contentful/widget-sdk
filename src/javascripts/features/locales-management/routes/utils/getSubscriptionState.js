import _ from 'lodash';
import { getSpaceContext } from 'classes/spaceContext';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';

const getPageRouteRef = (page = '') => {
  const spaceContext = getSpaceContext();
  const org = spaceContext.getData('organization');

  if (!org || !isOwnerOrAdmin(org)) {
    return null;
  }

  return {
    path: ['account', 'organizations', page],
    params: {
      orgId: _.get(org, 'sys.id'),
    },
  };
};

/**
 * Returns the state object for the current space's org account/subscription
 * view if the user has permission to access it otherwise returns null.
 */
export function getSubscriptionState() {
  return getPageRouteRef('subscription');
}
