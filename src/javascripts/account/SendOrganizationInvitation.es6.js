import * as K from 'utils/kefir.es6';
import { get, entries } from 'lodash';
import { runTask } from 'utils/Concurrent.es6';
import { create as createSpaceRepo } from 'access_control/SpaceMembershipRepository.es6';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { invite as inviteToOrg } from 'access_control/OrganizationMembershipRepository.es6';

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
export function invite({ emails, orgRole, spaceMemberships, suppressInvitation, orgId }) {
  const orgEndpoint = createOrganizationEndpoint(orgId);

  // If the org invitation succeeds (or if it fails with 422 [taken]),
  // invite the user to all selected spaces with the respective roles.
  const sendInvitation = email =>
    runTask(function*() {
      try {
        yield inviteToOrg(orgEndpoint, { email, role: orgRole, suppressInvitation });
        yield inviteToSpaces(email, spaceMemberships);
        progressBus.emit(email);
      } catch (e) {
        if (isTaken(e)) {
          yield inviteToSpaces(email, spaceMemberships);
          progressBus.emit(email);
        } else {
          progressBus.error(email);
        }
      }
    });

  return Promise.all(emails.map(sendInvitation));
}

function inviteToSpaces(email, spaceMemberships) {
  const memberships = entries(spaceMemberships);
  const invitations = memberships.map(([spaceId, roles]) =>
    runTask(function*() {
      const spaceEndpoint = createSpaceEndpoint(spaceId);
      const inviteToSpace = createSpaceRepo(spaceEndpoint).invite;
      try {
        yield inviteToSpace(email, roles);
      } catch (e) {
        // ignore
      }
    })
  );

  return Promise.all(invitations);
}

function isTaken(error) {
  const status = get(error, 'statusCode');
  const errors = get(error, 'data.details.errors', []);

  return status === 422 && errors.length && errors[0].name === 'taken';
}
