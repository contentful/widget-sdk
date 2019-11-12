import * as OrganizationRoles from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import * as K from 'utils/kefir';
import { get } from 'lodash';
import createLegacyFeatureService from 'services/LegacyFeatureService';

export function create({ space, organization }) {
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
    canCreateOrganization
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
    const isSpaceAdmin = space ? get(space, 'spaceMember.admin') : false;
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
    if (!isSuperUser() || !space) {
      return Promise.resolve(false);
    } else {
      const FeatureService = createLegacyFeatureService(space.sys.id);
      return FeatureService.get('customRoles');
    }
  }
}
