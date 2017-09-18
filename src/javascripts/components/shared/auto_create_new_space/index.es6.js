import {find} from 'lodash';
import moment from 'moment';
import theStore from 'TheStore';
import {combine} from 'utils/kefir';
import {user$, spacesByOrganization$ as spacesByOrg$} from 'services/TokenStore';
import createSampleSpace, {getOwnedOrgs} from './CreateSampleSpace';

export function init () {
  let creatingSampleSpace = false;

  combine([user$, spacesByOrg$])
    .filter(([user, spacesByOrg]) => user && spacesByOrg && qualifyUser(user, spacesByOrg) && !creatingSampleSpace)
    .onValue(([user, spacesByOrg]) => {
      creatingSampleSpace = true;
      createSampleSpace(user, spacesByOrg)
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
