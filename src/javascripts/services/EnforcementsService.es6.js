import {isArray, get} from 'lodash';
import { createSpaceEndpoint } from 'data/EndpointFactory';

// 30 seconds
const ENFORCEMENT_INFO_REFRESH_INTERVAL = 30 * 1000;

let enforcements;

export function getEnforcements () {
  return enforcements;
}

/*
  Initializes the Enforcements refreshing mechanism.

  Does NOT take care of teardown in case of spaceId change. This should be handled
  in the service(s) that initialize this.
 */
export function init (spaceId) {
  // Call initial refresh
  refresh(spaceId);

  // set refreshing interval
  const refreshInterval = window.setInterval(refresh.bind(this, spaceId), ENFORCEMENT_INFO_REFRESH_INTERVAL);

  return function deinit () {
    window.clearInterval(refreshInterval);
  };
}

/**
 * Refresh enforcements info with space id, and set an interval to update it every 30 sec
 */
export async function refresh (spaceId) {
  const newEnforcements = await fetchEnforcements(spaceId);

  if (!compareEnforcements(enforcements, newEnforcements)) {
    enforcements = newEnforcements;
  }
}

async function fetchEnforcements (spaceId) {
  const endpoint = createSpaceEndpoint(spaceId);

  const raw = await endpoint({
    method: 'GET',
    path: [ 'enforcements' ]
  });

  return raw.items;
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
