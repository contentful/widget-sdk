import { getModule } from 'NgRegistry';
import _ from 'lodash';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import * as logger from 'services/logger';
import { filterRelevantJobsForEntity, sortJobsByRelevance } from 'app/ScheduledActions/utils';
import { getScheduledActionsFeatureVariation } from '../ScheduledActionsFeatureFlag';

/**
 * A function that memoizes the result for 400ms and then clears the cache
 */
const batchedScheduleActionsLoader = _.memoize((spaceId, environmentId) => {
  const spaceEndpoint = createSpaceEndpoint(spaceId, environmentId);

  setTimeout(() => {
    batchedScheduleActionsLoader.cache.clear();
  }, 400);

  return ScheduledActionsService.getJobs(spaceEndpoint, {
    order: 'scheduledFor.datetime',
    'sys.status': 'scheduled',
    'environment.sys.id': environmentId,
  });
});

export async function getPendingScheduledActions() {
  const spaceContext = getModule('spaceContext');

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
      logger.logError('Failed to fetch pending jobs for entry editor', {
        err,
      });
      jobs = [];
    }
    const relevantJobs = filterRelevantJobsForEntity(jobs, entityType, entityId);
    return sortJobsByRelevance(relevantJobs);
  },
};
