import { getModule } from 'NgRegistry';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import * as logger from 'services/logger';
import { getScheduledActionsFeatureVariation } from '../ScheduledActionsFeatureFlag';

export async function initScheduledActionsStore($scope) {
  let pendingScheduledActions = [];
  $scope.scheduledActionsStore = {
    getPendingScheduledActions() {
      return pendingScheduledActions;
    }
  };
  try {
    pendingScheduledActions = await getPendingScheduledActions();
  } catch (err) {
    logger.logError('Failed to fetch pending jobs for entry editor', {
      err
    });
    pendingScheduledActions = [];
  }
}

export async function getPendingScheduledActions() {
  const spaceContext = getModule('spaceContext');

  const isEnabled = await getScheduledActionsFeatureVariation({
    organizationId: spaceContext.getData('organization.sys.id'),
    spaceId: spaceContext.space.data.sys.id
  });
  if (!isEnabled) {
    return [];
  }

  const spaceEndpoint = createSpaceEndpoint(
    spaceContext.space.data.sys.id,
    spaceContext.space.environment.sys.id
  );

  const collection = await ScheduledActionsService.getJobs(spaceEndpoint, {
    order: 'scheduledFor.datetime',
    'sys.status': 'scheduled',
    'environment.sys.id': spaceContext.space.environment.sys.id
  });

  return collection.items;
}
