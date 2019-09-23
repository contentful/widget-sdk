import { useAsyncFn } from 'app/common/hooks/useAsync.es6';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { createOrgMembership, invite } from 'access_control/OrganizationMembershipRepository.es6';
import { create as createSpaceMembershipRepo } from 'access_control/SpaceMembershipRepository.es6';
import { createTeamMembership } from 'access_control/TeamRepository.es6';
import { ADMIN_ROLE_ID } from 'access_control/constants.es6';
import { PENDING_ORG_MEMBERSHIPS } from 'featureFlags.es6';
import { getVariation } from 'LaunchDarkly.es6';

// Add a list of users to the organization
// If the org has Single Sign On enabled, we create the org memberships directly
// If not, we send invitations to the emails addresses
// returns an object { failures, successes }
export function useAddToOrg(orgId, hasSsoEnabled, onProgress = () => {}) {
  const fn = async (emails, role, spaceMemberships = [], teams = [], suppressInvitation) => {
    const orgEndpoint = createOrganizationEndpoint(orgId);
    const shouldUseNewInvitation = await getVariation(PENDING_ORG_MEMBERSHIPS);

    // use the new invitation flow using pending org memberships
    // this new process will also cover SSO
    if (shouldUseNewInvitation) {
      return sendInvitations(
        createInvitationWithPendingMembership,
        onProgress,
        orgEndpoint,
        emails,
        role,
        spaceMemberships,
        teams
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
        spaceMemberships,
        teams
      );
    } else {
      // if the org does not use SSO, create invitations
      return sendInvitations(
        inviteToOrg,
        onProgress,
        orgEndpoint,
        emails,
        role,
        spaceMemberships,
        teams
      );
    }
  };

  return useAsyncFn(fn);
}

/**
 * Create org memberships with emails addresses provided.
 * Used only when the org has SSO enabled
 * @param {Object} endpoint Org endpoint
 * @param {String[]} email Email address to be added
 * @param {String} role An org role. One of 'owner', 'admin' or 'member'
 * @param {Boolean} suppressInvitation If the email notification should be suppressed
 */
async function addToOrg(endpoint, email, role, suppressInvitation, spaceMemberships, teams) {
  const membership = await createOrgMembership(endpoint, { role, email, suppressInvitation });
  addToSpaces(email, spaceMemberships);
  addToTeams(endpoint, membership.sys.id, teams);
}

/**
 * Add org members to spaces.
 * Used when the org has SSO enabled
 * or in the new invitation flow behind a FF
 * @param {String[]} email
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
  // will never reject as we are catching any errors above
  return Promise.all(requests);
}

async function addToTeams(endpoint, orgMembershipId, teams) {
  const requests = teams.map(async team => {
    try {
      await createTeamMembership(endpoint, orgMembershipId, team.sys.id);
    } catch {
      //
    }
  });

  return Promise.all(requests);
}

/**
 * Create invitation plans for the provided emails addresses
 * with the respective space memberships.
 * This is only used if the org does not use SSO
 * @param {Object} endpoint Org endpoint
 * @param {String[]} email
 * @param {String} role An org role. One of 'owner', 'admin' or 'member'
 * @param {*} spaceMemberships An array with objects containing the space and the role ids. { space: {}, roles: []}
 */
async function inviteToOrg(endpoint, email, role, spaceMemberships, teams) {
  return invite(endpoint, {
    role,
    email,
    spaceInvitations: convertSpaceMemberships(spaceMemberships),
    teams: teams.map(team => team.sys.id)
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
async function createInvitationWithPendingMembership(
  endpoint,
  email,
  role,
  spaceMemberships,
  teams
) {
  const invitation = await invite(
    endpoint,
    {
      role,
      email
    },
    true
  );
  const orgMembershipId = invitation.sys.organizationMembership.sys.id;
  addToSpaces(email, spaceMemberships);
  addToTeams(endpoint, orgMembershipId, teams);
}

// Send out invitation requests.
// This will keep a record of successfull and unsuccessful requests and call
// a progress callback function after every call.
// Returns an object containing successes and failures
async function sendInvitations(fn, onProgress, endpoint, emails, ...fnArgs) {
  const successes = [];
  const failures = [];
  const requests = emails.map(async email => {
    try {
      await fn(endpoint, email, ...fnArgs);
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
