import * as OrganizationRoles from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import * as K from 'utils/kefir';
import {get} from 'lodash';

import require from 'require';
// TODO prevent circular ref

export function create ({space, organization}) {
  const createFeatureService = require('services/FeatureService').default;
  const userQuota = {
    // TODO get from limits/usage endpoint
    limit: get(organization, 'subscriptionPlan.limits.permanent.organizationMembership', -1),
    used: get(organization, 'usage.permanent.organizationMembership', 1)
  };

  if (!space) {
    return;
  }

  const FeatureService = createFeatureService(space.sys.id);

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
  function canCreateOrganization () {
    return get(K.getValue(TokenStore.user$), 'canCreateOrganization', false);
  }

  function isSuperUser () {
    const isSpaceAdmin = get(space, 'spaceMembership.admin');
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
  function canModifyRoles () {
    if (!isSuperUser()) {
      return Promise.resolve(false);
    } else {
      return FeatureService.get('customRoles').then(feature => {
        return Boolean(feature && feature.enabled);
      });
    }
  }
}
