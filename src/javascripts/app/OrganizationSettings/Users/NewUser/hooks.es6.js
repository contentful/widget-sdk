import { useAsyncFn } from 'app/common/hooks/useAsync.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { createOrgMembership, invite } from 'access_control/OrganizationMembershipRepository.es6';
import { getOrganization } from 'services/TokenStore.es6';

// Add a list of users to the organization
// If the org has Single Sign On enabled, we create the org memberships directly
// If not, we send invitations to the emails addresses
export function useAddToOrg(orgId) {
  const fn = async (emails, role) => {
    const { hasSsoEnabled } = await getOrganization(orgId);
    const endpoint = createOrganizationEndpoint(orgId);
    const method = hasSsoEnabled ? createOrgMembership : invite;
    const requests = emails.map(email => method(endpoint, { role, email }));

    return Promise.all(requests);
  };

  return useAsyncFn(fn);
}
