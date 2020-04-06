import { useAsyncFn } from 'app/common/hooks/useAsync';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { invite } from 'access_control/OrganizationMembershipRepository';
import { create as createSpaceMembershipRepo } from 'access_control/SpaceMembershipRepository';
import { createTeamMembership } from 'access_control/TeamRepository';

// Add a list of users to the organization
// returns an object { failures, successes }
export function useAddToOrg(orgId, onProgress = () => {}) {
  const fn = async (emails, role, spaceMemberships = [], teams = []) => {
    return sendInvitations(orgId, emails, role, spaceMemberships, teams, onProgress);
  };

  return useAsyncFn(fn);
}

/**
 * Add org members to spaces.
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
  const requests = teams.map(async (team) => {
    try {
      await createTeamMembership(endpoint, orgMembershipId, team.sys.id);
    } catch {
      //
    }
  });

  return Promise.all(requests);
}

// Send out invitation requests.
// This will keep a record of successfull and unsuccessful requests and call
// a progress callback function after every call.
// Returns an object containing successes and failures
async function sendInvitations(orgId, emails, role, spaceMemberships, teams, onProgress) {
  const orgEndpoint = createOrganizationEndpoint(orgId);
  const successes = [];
  const failures = [];
  const requests = emails.map(async (email) => {
    try {
      const invitation = await invite(orgEndpoint, {
        role,
        email,
      });
      const orgMembershipId = invitation.sys.organizationMembership.sys.id;
      await Promise.all([
        addToSpaces(email, spaceMemberships),
        addToTeams(orgEndpoint, orgMembershipId, teams),
      ]);
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
