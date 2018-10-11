import require from 'require';
import { isArray, get } from 'lodash';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { getSpace } from 'services/TokenStore.es6';

const flagName = 'feature-bv-2018-08-enforcements-api';

const genFrozenSpaceEnforcement = spaceId => {
  return {
    additionalPolicies: [],
    deniedPermissions: {
      ContentType: ['create', 'update', 'delete', 'publish', 'unpublish'],
      Entry: ['create', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
      Asset: ['create', 'update', 'delete', 'publish', 'unpublish', 'archive', 'unarchive'],
      Settings: ['read']
    },
    reason: 'frozenSpace',
    sys: {
      type: 'Enforcement',
      id: 'enforcement-3432ae1180cc7d8aab6b40448bf6fa5433850c04',
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: spaceId
        }
      }
    }
  };
};

// 30 seconds
// This is the Varnish caching time for this endpoint
const ENFORCEMENT_INFO_REFRESH_INTERVAL = 30 * 1000;
const enforcements = {};

export function getEnforcements(spaceId) {
  if (!spaceId) {
    return null;
  }

  return get(enforcements, spaceId, null);
}

/*
  Initializes the Enforcements refreshing mechanism.

  Does NOT take care of teardown in case of spaceId change. This should be handled
  in the service(s) that initialize this.
 */
export function init(spaceId) {
  // Call initial refresh
  refresh(spaceId);

  // set refreshing interval
  const refreshInterval = window.setInterval(
    refresh.bind(this, spaceId),
    ENFORCEMENT_INFO_REFRESH_INTERVAL
  );

  return function deinit() {
    window.clearInterval(refreshInterval);
    delete enforcements[spaceId];
  };
}

/**
 * Refresh enforcements info with space id, and sets enforcements for given `spaceId`
 * if the enforcements change.
 */
export async function refresh(spaceId) {
  const newEnforcements = await fetchEnforcements(spaceId);
  const currentEnforcements = get(enforcements, spaceId);

  if (!enforcementsEqual(currentEnforcements, newEnforcements)) {
    enforcements[spaceId] = newEnforcements;
  }
}

let active = true;

function onBlur() {
  active = false;
}

function onFocus() {
  active = true;
}

window.onfocus = onFocus;
window.onblur = onBlur;

// IE
document.onfocusin = onFocus;
document.onfocusout = onBlur;

async function fetchEnforcements(spaceId) {
  // To get around circular dep
  const { getCurrentVariation } = require('utils/LaunchDarkly');
  const useApi = await getCurrentVariation(flagName);
  const useFrozenSpaceEnf = await getCurrentVariation('frozen-space-test');

  if (useFrozenSpaceEnf) {
    return [genFrozenSpaceEnforcement(spaceId)];
  }

  if (active && useApi) {
    const endpoint = createSpaceEndpoint(spaceId);

    const raw = await endpoint({
      method: 'GET',
      path: ['enforcements']
    });

    return raw.items;
  } else {
    const tokenSpace = await getSpace(spaceId);
    return get(tokenSpace, `enforcements`, []);
  }
}

function enforcementsEqual(current, newEnforcements) {
  if (!isArray(current) || !isArray(newEnforcements)) {
    return current === newEnforcements;
  }

  if (current.length !== newEnforcements.length) {
    return false;
  }

  const allEnforcementsValuesEqual = current.reduce((isEqual, currentValue, valueIndex) => {
    // If it's not equal, just return false early
    if (!isEqual) {
      return false;
    }

    // Check that 1) there is a value at the same index in both enforcements, and 2) that the
    // value of both `sys.id` for the index is equal
    return get(currentValue, 'sys.id') === get(newEnforcements[valueIndex], 'sys.id');
  }, true);

  return allEnforcementsValuesEqual;
}
