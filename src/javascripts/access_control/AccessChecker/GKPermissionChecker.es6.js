import * as OrganizationRoles from 'services/OrganizationRoles.es6';
import * as TokenStore from 'services/TokenStore.es6';
import * as K from 'utils/kefir.es6';
import { get } from 'lodash';

import { getModule } from 'NgRegistry.es6';

const $injector = getModule('$injector');
// TODO prevent circular ref

export function create({ space, organization }) {
  const createFeatureService = $injector.get('services/FeatureService.es6').default;
  const userQuota = {
    // TODO get from limits/usage endpoint
    limit: get(organization, 'subscriptionPlan.limits.permanent.organizationMembership', -1),
    used: get(organization, 'usage.permanent.organizationMembership', 1)
  };

  return {
    getUserQuota: () => userQuota,
    /**
     * @name accessChecker#canModifyUsers
     * @returns {boolean}
     * @description
     * Returns true if Users can be modified.
     */
    canModifyUsers: () => isSuperUser(),
    canModifyRoles,
    canCreateOrganization,
    isSuperUser
  };

  /**
   * @name accessChecker#canCreateOrganization
   * @returns {boolean}
   * @description
   * Returns true if current user can create a new organization.
   */
  function canCreateOrganization() {
    return get(K.getValue(TokenStore.user$), 'canCreateOrganization', false);
  }

  function isSuperUser() {
    const isSpaceAdmin = space ? get(space, 'spaceMembership.admin') : undefined;
    const isOrganizationAdmin = OrganizationRoles.isAdmin(organization);
    const isOrganizationOwner = OrganizationRoles.isOwner(organization);
    return isSpaceAdmin || isOrganizationAdmin || isOrganizationOwner;
  }

  /**
   * @name accessChecker#canModifyRoles
   * @returns {boolean}
   * @description
   * Returns true if Roles can be modified.
   */
  function canModifyRoles() {
    if (!isSuperUser()) {
      return Promise.resolve(false);
    } else {
      return space ? createFeatureService(space.sys.id).get('customRoles') : undefined;
    }
  }
}
