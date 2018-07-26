import {isArray, get} from 'lodash';
import * as auth from 'Authentication';
import makeFetchEnforcements from 'data/CMA/EnforcementsInfo';

const ENFORCEMENT_INFO_REFRESH_INTERVAL = 30 * 1000;

const fetchEnforcements = makeFetchEnforcements(auth);

let enforcements;

export function getEnforcements () {
  return enforcements;
}

let timeout;

/**
 * Refresh enforcements info with space id, and set an interval to update it every 30 sec
 */
export async function refresh (spaceId) {
  const newEnforcements = await fetchEnforcements(spaceId);
  if (!compareEnforcements(enforcements, newEnforcements)) {
    enforcements = newEnforcements;
  }

  if (timeout) {
    window.clearTimeout(timeout);
  }

  timeout = window.setTimeout(() => refresh(spaceId), ENFORCEMENT_INFO_REFRESH_INTERVAL);
}

function compareEnforcements (a, b) {
  if (!isArray(a) || !isArray(b)) {
    return a === b;
  }
  if (a.length !== b.length) {
    return false;
  }
  if (a.find((value, index) => !compareById(value, b[index]))) {
    return false;
  } else {
    return true;
  }
}

function compareById (a, b) {
  return get(a, 'sys.id') === get(b, 'sys.id');
}
