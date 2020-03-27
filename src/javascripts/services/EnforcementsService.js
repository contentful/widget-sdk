import { isArray, get } from 'lodash';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';

// 30 seconds
// This is the Varnish caching time for this endpoint
const ENFORCEMENT_INFO_REFRESH_INTERVAL = 30 * 1000;
const enforcements = {};

// If the window is currently in focus. We do not make calls
// if the window is blurred, e.g. if the tab is changed
let windowIsFocused = true;

// A cache of the refresh intervals so that multiple `init` calls do not
// refresh multiple times
const refreshIntervals = {};

// A cache of the enforcments that are actively being fetched right now
const currentlyFetching = {};

function onBlur() {
  windowIsFocused = false;
}

function onFocus() {
  windowIsFocused = true;
}

window.addEventListener('blur', onBlur);
window.addEventListener('focus', onFocus);

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
  if (refreshIntervals[spaceId]) {
    return createDeinit(refreshIntervals[spaceId], spaceId);
  }

  // Call initial refresh
  refresh(spaceId);

  // set refreshing interval
  const refreshInterval = window.setInterval(
    refresh.bind(this, spaceId),
    ENFORCEMENT_INFO_REFRESH_INTERVAL
  );

  refreshIntervals[spaceId] = refreshInterval;

  return createDeinit(refreshIntervals[spaceId], spaceId);
}

function createDeinit(refreshInterval, spaceId) {
  return function deinit() {
    // Clear the interval, plus any cached values for this spaceId
    window.clearInterval(refreshInterval);
    delete refreshIntervals[spaceId];
    delete currentlyFetching[spaceId];
    delete enforcements[spaceId];
  };
}

/**
 * Refresh enforcements info with space id, and sets enforcements for given `spaceId`
 * if the enforcements change.
 */
export async function refresh(spaceId) {
  if (windowIsFocused && !currentlyFetching[spaceId]) {
    currentlyFetching[spaceId] = true;

    let newEnforcements;
    try {
      newEnforcements = await fetchEnforcements(spaceId);
    } catch (_) {
      // Do nothing, we don't care if there is an error
      currentlyFetching[spaceId] = false;
      return;
    }

    const currentEnforcements = get(enforcements, spaceId);

    if (!enforcementsEqual(currentEnforcements, newEnforcements)) {
      enforcements[spaceId] = newEnforcements;
    }

    currentlyFetching[spaceId] = false;
  }
}

/**
 * Performs checks based on entities' limits and usages within a given environment
 * and generates enforcements accordingly.
 *
 * NB: When the `ENVIRONMENT_USAGE_ENFORCEMENT` product catalog flag is enabled,
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
          reason: 'usageExceeded',
        },
      };
      enforcement['deniedPermissions']['deniedPerms'][entity] = ['create'];

      enforcements.push({ Enforcement: enforcement });

      reasonsDenied = (action, entityType) => {
        return [
          'usageExceeded',
          `You do not have permissions to ${action} on ${entityType}, please contact your administrator for more information.`,
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
    path: ['enforcements'],
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
