import { getMemberships } from 'access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

import { isOwner as isOrgOwner } from 'services/OrganizationRoles';

export const fetchCanLeaveOrg = async orgMembership => {
  if (isOrgOwner(orgMembership)) {
    const orgEndpoint = createOrganizationEndpoint(orgMembership.sys.id);
    try {
      const orgMembershipsData = await getMemberships(orgEndpoint, {
        role: 'owner',
        limit: 0
      });

      // If there is currently more than 1 owner, the user may leave the org, otherwise they are the last owner and cannot leave.
      return orgMembershipsData.total > 1 ? true : false;
    } catch {
      // If the request fails, return true and allow the user to try to leave the Organization. If they shouldn't be able to, this should be caught on the backend.
      return true;
    }
  } else {
    // Non org-owners can always leave the org
    return true;
  }
};
