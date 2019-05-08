import { isArray, get } from 'lodash';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import createResourceService from 'services/ResourceService.es6';

// 30 seconds
// This is the Varnish caching time for this endpoint
const ENFORCEMENT_INFO_REFRESH_INTERVAL = 30 * 1000;
const enforcements = {};

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
  if (active) {
    const newEnforcements = await fetchEnforcements(spaceId);
    const currentEnforcements = get(enforcements, spaceId);

    if (!enforcementsEqual(currentEnforcements, newEnforcements)) {
      enforcements[spaceId] = newEnforcements;
    }
  }
}

/**
 * Performs checks based on entities' limits and usages within a given environment
 * and generates enforcements accordingly.
 *
 * NB: When the `ENVIRONMENT_USAGE_ENFORCEMENT` feature flag is enabled,
 * Worf's usage checking ability is ignored and this method is invoked.
 * This is because Worf doesn't check usages on non master environments.
 */
export async function newUsageChecker(spaceId, environmentId) {
  const service = createResourceService(spaceId);
  const result = await service.canCreateEnvironmentResources(environmentId);

  delete result.Locale;
  delete result.Record;

  return generateNewUsageCheckEnforcements(result);
}

// generate enforcements based on the new usage check
function generateNewUsageCheckEnforcements(allowedToCreate) {
  const enforcements = [];
  let reasonsDenied = () => [];
  const deniedEntities = [];

  for (const entity in allowedToCreate) {
    if (!allowedToCreate[entity]) {
      deniedEntities.push(entity);

      const enforcement = {
        additionalPolicies: [],
        deniedPermissions: {
          deniedPerms: {},
          reason: 'usageExceeded'
        }
      };
      enforcement['deniedPermissions']['deniedPerms'][entity] = ['create'];

      enforcements.push({ Enforcement: enforcement });

      reasonsDenied = (action, entityType) => {
        return [
          'usageExceeded',
          `You do not have permissions to ${action} on ${entityType}, please contact your administrator for more information.`
        ];
      };
    }
  }

  return { enforcements, reasonsDenied, deniedEntities };
}

async function fetchEnforcements(spaceId) {
  const endpoint = createSpaceEndpoint(spaceId);

  const raw = await endpoint({
    method: 'GET',
    path: ['enforcements']
  });

  return raw.items;
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
