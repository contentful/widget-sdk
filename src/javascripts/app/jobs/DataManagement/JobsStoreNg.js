import { createSpaceEndpoint } from 'data/EndpointFactory';
import * as JobsService from 'app/jobs/DataManagement/JobsService';
import * as logger from 'services/logger';
import { getJobsFeatureVariation } from '../JobsFeatureFlag';

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
    const jobsCollection = await JobsService.getJobs(spaceEndpoint, {
      order: 'sys.scheduledAt',
      'sys.status': 'pending'
    });

    return jobsCollection.items;
  } catch (err) {
    logger.logError('Failed to fetch pending jobs for entry editor', {
      err
    });
    return [];
  }
}
