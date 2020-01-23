import { createSpaceEndpoint } from 'data/EndpointFactory';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import * as logger from 'services/logger';
import { getJobsFeatureVariation } from '../ScheduledActionsFeatureFlag';

export async function initJobStore($scope, spaceContext) {
  $scope.pendingJobs = [];
  $scope.jobsStore = {
    getPendingJobs() {
      return $scope.pendingJobs;
    }
  };

  const isEnabled = await getJobsFeatureVariation({
    organizationId: spaceContext.getData('organization.sys.id'),
    spaceId: spaceContext.space.data.sys.id
  });

  if (isEnabled) {
    $scope.pendingJobs = await getPendingJobs(spaceContext);
  }
}

async function getPendingJobs(spaceContext) {
  try {
    const spaceEndpoint = createSpaceEndpoint(
      spaceContext.space.data.sys.id,
      spaceContext.space.environment.sys.id
    );
    const jobsCollection = await ScheduledActionsService.getJobs(spaceEndpoint, {
      order: 'scheduledFor.datetime',
      'sys.status': 'scheduled',
      'environment.sys.id': spaceContext.space.environment.sys.id
    });

    return jobsCollection.items;
  } catch (err) {
    logger.logError('Failed to fetch pending jobs for entry editor', {
      err
    });
    return [];
  }
}
