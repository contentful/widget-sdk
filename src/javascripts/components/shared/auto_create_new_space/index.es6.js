import {find} from 'lodash';
import moment from 'moment';
import theStore from 'TheStore';
import {combine} from 'utils/kefir';
import {user$, spacesByOrganization$ as spacesByOrg$} from 'services/TokenStore';
import createSampleSpace from './CreateSampleSpace';

/**
 * @description
 * Auto creates a space using the product catalogue template
 * for a user that is <= 7 days old.
 * It is hooked up in the run block in application prelude.
 */

export function init () {
  let creatingSampleSpace = false;

  combine([user$, spacesByOrg$])
    .filter(([user, spacesByOrg]) => user && spacesByOrg && qualifyUser(user, spacesByOrg) && !creatingSampleSpace)
    .onValue(([user, spacesByOrg]) => {
      const org = getFirstOwnedOrgWithoutSpaces(user, spacesByOrg);

      creatingSampleSpace = true;
      createSampleSpace(org, 'product catalogue')
        .then(_ => {
          theStore.set(getKey(user), true);
        })
        .finally(_ => {
          creatingSampleSpace = false;
        });
    });
}

function qualifyUser (user, spacesByOrg) {
  return !hadSpaceAutoCreated(user) &&
    isRecentUser(user) &&
    !hasAnOrgWithSpaces(spacesByOrg) &&
    ownsAtleastOneOrg(user);
}

function hadSpaceAutoCreated (user) {
  return theStore.get(getKey(user));
}

function getKey (user) {
  return `ctfl:${user.sys.id}:spaceAutoCreated`;
}

// qualify a user if it was created in the last week
function isRecentUser (user) {
  const SECONDS_IN_WEEK = 7 * 24 * 60 * 60;
  const creationDate = moment(user.sys.createdAt);
  const now = moment();
  const diff = now.diff(creationDate, 'seconds');

  return diff <= SECONDS_IN_WEEK;
}

function hasAnOrgWithSpaces (spacesByOrg) {
  return find(spacesByOrg, spaces => !!spaces.length);
}

function ownsAtleastOneOrg (user) {
  return !!getOwnedOrgs(user.organizationMemberships).length;
}

function getOwnedOrgs (orgMemberships) {
  // filter out orgs user owns
  return orgMemberships.filter(org => org.role === 'owner');
}

function getFirstOwnedOrgWithoutSpaces (user, spacesByOrg) {
  const ownedOrgs = getOwnedOrgs(user.organizationMemberships);
  // return the first org that has no spaces
  const orgMembership = find(ownedOrgs, ownedOrg => {
    const spacesForOrg = spacesByOrg[ownedOrg.organization.sys.id];

    return !spacesForOrg || spacesForOrg.length === 0;
  });

  return orgMembership && orgMembership.organization;
}
