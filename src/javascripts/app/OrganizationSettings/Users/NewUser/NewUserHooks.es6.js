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
export function useAddToOrg(orgId, hasSsoEnabled) {
  const fn = async (emails, role, spaceMemberships, suppressInvitation) => {
    const orgEndpoint = createOrganizationEndpoint(orgId);
    const shouldUseNewInvitation = await getVariation(
      'feature-bv-09-2019-new-invitation-flow-new-entity'
    );

    // use the new invitation flow using pending org memberships
    if (shouldUseNewInvitation) {
      return createInvitationWithPendingMembership(orgEndpoint, emails, role, spaceMemberships);
    }

    // old flow. sso + non-sso
    if (hasSsoEnabled) {
      // if the org is SSO enabled, create org memberships directly
      const { failures, successes } = await addToOrg(orgEndpoint, emails, role, suppressInvitation);
      // invite all successfuly added org members to the spaces
      await addToSpaces(successes, spaceMemberships);
      return { failures, successes };
    } else {
      // if the org does not use SSO, create invitations
      return inviteToOrg(orgEndpoint, emails, role, spaceMemberships);
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
async function addToOrg(endpoint, emails, role, suppressInvitation) {
  const failures = [];
  const successes = [];

  const requests = emails.map(async email => {
    try {
      await createOrgMembership(endpoint, { role, email, suppressInvitation });
      successes.push(email);
    } catch (e) {
      failures.push({ email, error: e });
    }
  });

  await Promise.all(requests);
  return { failures, successes };
}

/**
 * Add org members to spaces.
 * Used only when the org has SSO enabled.
 * @param {String[]} emails
 * @param {Array} spaceMemberships An array with objects containing the space and the role ids. { space: {}, roles: []}
 */
async function addToSpaces(emails, spaceMemberships) {
  const requests = spaceMemberships.flatMap(({ space, roles }) => {
    const spaceEndpoint = createSpaceEndpoint(space.sys.id);
    return emails.map(async email => {
      const invite = createSpaceMembershipRepo(spaceEndpoint).invite;
      try {
        await invite(email, roles);
      } catch {
        // ignore
      }
    });
  });

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
async function inviteToOrg(endpoint, emails, role, spaceMemberships) {
  const failures = [];
  const successes = [];

  const requests = emails.map(async email => {
    try {
      await invite(endpoint, {
        role,
        email,
        spaceInvitations: convertSpaceMemberships(spaceMemberships)
      });
      successes.push(email);
    } catch (e) {
      failures.push({ email, error: e });
    }
  });

  await Promise.all(requests);

  return { failures, successes };
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
async function createInvitationWithPendingMembership(endpoint, emails, role, spaceMemberships) {
  const failures = [],
    successes = [];
  const requests = emails.map(async email => {
    try {
      await invite(
        endpoint,
        {
          role,
          email
        },
        true
      );
      successes.push(email);
    } catch (e) {
      failures.push({ email, error: e });
    }
  });
  // send out all org invitations
  await Promise.all(requests);

  // add all successfuly invited members to the spaces
  await addToSpaces(successes, spaceMemberships);

  return { failures, successes };
}
