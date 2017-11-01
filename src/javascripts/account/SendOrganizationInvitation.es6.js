import * as K from 'utils/kefir';
import {get, entries} from 'lodash';
import {runTask} from 'utils/Concurrent';
import {create as createSpaceRepo} from 'access_control/SpaceMembershipRepository';
import {createEndpoint as createOrgEndpoint, invite as inviteToOrg} from 'access_control/OrganizationMembershipRepository';
import {createSpaceEndpoint} from 'data/Endpoint';
import * as auth from 'Authentication';
import {apiUrl} from 'Config';

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
export function invite ({emails, orgRole, spaceMemberships, suppressInvitation, orgId}) {
  const orgEndpoint = createOrgEndpoint(orgId);

  // If the org invitation succeeds (or if it fails with 422 [taken]),
  // invite the user to all selected spaces with the respective roles.
  const sendInvitation = (email) => runTask(function* () {
    try {
      yield inviteToOrg(orgEndpoint, {email, role: orgRole, suppressInvitation});
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

function inviteToSpaces (email, spaceMemberships) {
  const memberships = entries(spaceMemberships);
  const invitations = memberships.map(([spaceId, roles]) => runTask(function* () {
    const spaceEndpoint = createSpaceEndpoint(apiUrl(), spaceId, auth);
    const inviteToSpace = createSpaceRepo(spaceEndpoint).invite;
    try {
      yield inviteToSpace(email, roles);
    } catch (e) {
      // ignore
    }
  }));

  return Promise.all(invitations);
}

function isTaken (error) {
  const status = get(error, 'statusCode');
  const errors = get(error, 'data.details.errors', []);

  return status === 422 && errors.length && errors[0].name === 'taken';
}
