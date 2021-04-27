import { getSpaceContext } from 'classes/spaceContext';
import _ from 'lodash';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import { filterRelevantJobsForEntity, sortJobsByRelevance } from 'app/ScheduledActions/utils';
import { getScheduledActionsFeatureVariation } from '../ScheduledActionsFeatureFlag';

// We expire the ScheduledActions cache every 5s
// Right now it's being used to display "scheduled icons" for all references of an Entity.
const DEFAULT_CACHE_TIMEOUT_MS = 5000;

/**
 * A function that memoizes the result for 5000ms and then clears the cache
 */
const batchedScheduleActionsLoader = _.memoize((spaceId, environmentId) => {
  const spaceEndpoint = createSpaceEndpoint(spaceId, environmentId);

  setTimeout(() => {
    batchedScheduleActionsLoader.cache.clear();
  }, DEFAULT_CACHE_TIMEOUT_MS);

  return ScheduledActionsService.getJobs(spaceEndpoint, {
    order: 'scheduledFor.datetime',
    'sys.status': 'scheduled',
    'environment.sys.id': environmentId,
    limit: 500,
  });
});

export async function getPendingScheduledActions() {
  const spaceContext = getSpaceContext();

  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();
  const organizationId = spaceContext.getData('organization.sys.id');

  const isEnabled = await getScheduledActionsFeatureVariation({
    organizationId,
    spaceId,
  });

  if (!isEnabled) {
    return [];
  }

  const collection = await batchedScheduleActionsLoader(spaceId, environmentId);
  return collection.items;
}

export default {
  getAllScheduledActions: () => {
    return getPendingScheduledActions();
  },
  getEntityScheduledActions: async (entityType, entityId) => {
    let jobs = [];
    try {
      jobs = await getPendingScheduledActions();
    } catch (err) {
      jobs = [];
    }
    const relevantJobs = filterRelevantJobsForEntity(jobs, entityType, entityId);
    return sortJobsByRelevance(relevantJobs);
  },
};
