import * as K from 'utils/kefir.es6';
import { get } from 'lodash';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { create as createSpaceRepo } from 'access_control/SpaceMembershipRepository';
import {
  invite as inviteToOrg,
  createOrgMembership
} from 'access_control/OrganizationMembershipRepository';

const progressBus = K.createStreamBus();

/**
 * @name account/InviteToOrganization#progress$
 * @description
 * A stream of email address that either succeeded or failed the invitation
 *
 * @usage[js]
 * progress$.onValue((email) => console.log(`${email} was invited!`));
 * progress$.onError((email) => console.log(`${email} failed to be invited.`));
 *
 */
export const progress$ = progressBus.stream;

/**
 * @name account/InviteToOrganization#invite
 * @description
 * Sends invitations to the organization and spaces to all emails in the list.
 *
 * @param {Array<String>} emails
 * @param {String} role an organization role name
 * @param {Object} spaceMemberships an object with space ids as keys and arrays of role ids as values
 * @param {Boolean} supressInvitation
 * @param {String} orgId
 * @returns {Promise}
 */
export async function sendInvites({ emails, orgRole, spaceMemberships, orgId }) {
  return invite({ emails, orgRole, spaceMemberships, orgId });
}

export async function createOrgMemberships({
  emails,
  orgRole,
  spaceMemberships,
  suppressInvitation,
  orgId
}) {
  const orgEndpoint = createOrganizationEndpoint(orgId);

  // If the org invitation succeeds (or if it fails with 422 [taken]),
  // invite the user to all selected spaces with the respective roles.
  const sendInvitation = async email => {
    try {
      await createOrgMembership(orgEndpoint, { email, role: orgRole, suppressInvitation });
      await inviteToSpaces(email, spaceMemberships);

      progressBus.emit(email);
    } catch (e) {
      if (isTaken(e)) {
        await inviteToSpaces(email, spaceMemberships);
        progressBus.emit(email);
      } else {
        progressBus.error(email);
      }
    }
  };

  return Promise.all(emails.map(sendInvitation));
}

function invite({ emails, orgRole, spaceMemberships, orgId }) {
  const orgEndpoint = createOrganizationEndpoint(orgId);

  // If the org invitation succeeds (or if it fails with 422 [taken]),
  // invite the user to all selected spaces with the respective roles.
  const spaceInvitations = spaceMemberships ? generateSpaceInvitations(spaceMemberships) : [];
  const role = orgRole ? orgRole : 'member';
  const sendInvitation = async email => {
    try {
      await inviteToOrg(orgEndpoint, {
        email,
        role,
        spaceInvitations
      });

      progressBus.emit(email);
    } catch (e) {
      progressBus.error(email);
    }
  };

  return Promise.all(emails.map(sendInvitation));
}

function inviteToSpaces(email, spaceMemberships) {
  const memberships = spaceMemberships ? Object.entries(spaceMemberships) : [];

  const invitations = memberships.map(async ([spaceId, roles]) => {
    const spaceEndpoint = createSpaceEndpoint(spaceId);
    const inviteToSpace = createSpaceRepo(spaceEndpoint).invite;

    try {
      await inviteToSpace(email, roles);
    } catch (e) {
      // ignore
    }
  });

  return Promise.all(invitations);
}

function isTaken(error) {
  const status = get(error, 'statusCode');
  const errors = get(error, 'data.details.errors', []);

  return status === 422 && errors.length && errors[0].name === 'taken';
}

function generateSpaceInvitations(spaceMemberships) {
  const memberships = Object.entries(spaceMemberships);

  return memberships.map(([spaceId, roles]) => {
    const hasAdminRole = roles.find(r => r === '__cf_builtin_admin');

    const membership = {
      spaceId
    };

    if (hasAdminRole) {
      membership.admin = true;
    } else {
      membership.roleIds = roles;
    }

    return membership;
  });
}
