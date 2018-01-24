import * as OrganizationRoles from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import * as K from 'utils/kefir';
import {get} from 'lodash';

export function create (space) {
  const organization = get(space, 'organization');
  const features = get(organization, 'subscriptionPlan.limits.features', {});
  const userQuota = {
    limit: get(organization, 'subscriptionPlan.limits.permanent.organizationMembership', -1),
    used: get(organization, 'usage.permanent.organizationMembership', 1)
  };

  const getUserQuota = () => userQuota;


  const hasFeature = (name) => get(features, name, false);

  /**
   * @name accessChecker#canModifyRoles
   * @returns {boolean}
   * @description
   * Returns true if Roles can be modified.
   */
  const canModifyRoles = () => isSuperUser() && hasFeature('customRoles');

  /**
   * @name accessChecker#canModifyUsers
   * @returns {boolean}
   * @description
   * Returns true if Users can be modified.
   */
  const canModifyUsers = () => isSuperUser();

  return {
    getUserQuota,
    hasFeature,
    canModifyRoles,
    canModifyUsers,
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
}
