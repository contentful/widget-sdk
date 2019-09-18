import { useAsyncFn } from 'app/common/hooks/useAsync.es6';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { createOrgMembership, invite } from 'access_control/OrganizationMembershipRepository.es6';
import { create as createSpaceMembershipRepo } from 'access_control/SpaceMembershipRepository.es6';
import { ADMIN_ROLE_ID } from 'access_control/constants.es6';
import { getVariation } from 'LaunchDarkly.es6';

// Add a list of users to the organization
// If the org has Single Sign On enabled, we create the org memberships directly
// If not, we send invitations to the emails addresses
// returns an object { failures, successes }
export function useAddToOrg(orgId, hasSsoEnabled, onProgress = () => {}) {
  const fn = async (emails, role, spaceMemberships, suppressInvitation) => {
    const orgEndpoint = createOrganizationEndpoint(orgId);
    const shouldUseNewInvitation = await getVariation(
      'feature-bv-09-2019-new-invitation-flow-new-entity'
    );

    // use the new invitation flow using pending org memberships
    // this new process will also cover SSO
    if (shouldUseNewInvitation) {
      return sendInvitations(
        createInvitationWithPendingMembership,
        onProgress,
        orgEndpoint,
        emails,
        role,
        spaceMemberships
      );
    }

    // old flow. SSO + non-SSO
    if (hasSsoEnabled) {
      // if the org is SSO enabled, create org memberships directly
      return sendInvitations(
        addToOrg,
        onProgress,
        orgEndpoint,
        emails,
        role,
        suppressInvitation,
        spaceMemberships
      );
    } else {
      // if the org does not use SSO, create invitations
      return sendInvitations(inviteToOrg, onProgress, orgEndpoint, emails, role, spaceMemberships);
    }
  };

  return useAsyncFn(fn);
}

/**
 * Create org memberships with emails addresses provided.
 * Used only when the org has SSO enabled
 * @param {Object} endpoint Org endpoint
 * @param {String[]} emails Email addresses to be added
 * @param {String} role An org role. One of 'owner', 'admin' or 'member'
 * @param {Boolean} suppressInvitation If the email notification should be suppressed
 */
async function addToOrg(endpoint, email, role, suppressInvitation, spaceMemberships) {
  await createOrgMembership(endpoint, { role, email, suppressInvitation });
  await addToSpaces(email, spaceMemberships);
}

/**
 * Add org members to spaces.
 * Used only when the org has SSO enabled.
 * @param {String[]} emails
 * @param {Array} spaceMemberships An array with objects containing the space and the role ids. { space: {}, roles: []}
 */
async function addToSpaces(email, spaceMemberships) {
  const requests = spaceMemberships.map(async ({ space, roles }) => {
    const spaceEndpoint = createSpaceEndpoint(space.sys.id);
    const invite = createSpaceMembershipRepo(spaceEndpoint).invite;
    try {
      await invite(email, roles);
    } catch {
      // ignore
    }
  });
  // will never return a rejection as we are catching any errors above
  return Promise.all(requests);
}

/**
 * Create invitation plans for the provided emails addresses
 * with the respective space memberships.
 * This is only used if the org does not use SSO
 * @param {Object} endpoint Org endpoint
 * @param {String[]} emails
 * @param {String} role An org role. One of 'owner', 'admin' or 'member'
 * @param {*} spaceMemberships An array with objects containing the space and the role ids. { space: {}, roles: []}
 */
async function inviteToOrg(endpoint, email, role, spaceMemberships) {
  return invite(endpoint, {
    role,
    email,
    spaceInvitations: convertSpaceMemberships(spaceMemberships)
  });
}

function convertSpaceMemberships(spaceMemberships) {
  return spaceMemberships.map(({ space, roles }) => {
    const hasAdminRole = roles.some(role => role === ADMIN_ROLE_ID);

    return {
      spaceId: space.sys.id,
      admin: hasAdminRole,
      roleIds: hasAdminRole ? [] : roles
    };
  });
}

// Alpha invitation flow. Under a feature flag ('feature-bv-09-2019-new-invitation-flow-new-entity')
// Requires alpha header (x-contentful-enable-alpha-feature: pending-org-membership)
async function createInvitationWithPendingMembership(endpoint, email, role) {
  return invite(
    endpoint,
    {
      role,
      email
    },
    true
  );
}

// Send out invitation requests.
// This will keep a record of successfull and unsuccessful requests and call
// a progress callback function after every call.
// Returns an object containing successes and failures
async function sendInvitations(fn, onProgress, endpoint, emails, ...rest) {
  const successes = [];
  const failures = [];
  const requests = emails.map(async email => {
    try {
      await fn(endpoint, email, ...rest);
      successes.push(email);
    } catch (e) {
      failures.push({ email, error: e });
    } finally {
      onProgress({ successes, failures });
    }
  });

  await Promise.all(requests);

  return { successes, failures };
}
