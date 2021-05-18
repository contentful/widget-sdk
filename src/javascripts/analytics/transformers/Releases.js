import { getSpaceContext } from 'classes/spaceContext';

const Actions = {
  OPEN: 'open',
  CLOSE: 'close',
};

function getEnvId() {
  const spaceContext = getSpaceContext();
  const environmentId = spaceContext.getEnvironmentId();

  return environmentId;
}

const commonParams = (data) => ({
  organization_key: data.organizationId,
  space_key: data.spaceId,
  environment_key: getEnvId(),
});

const getReleaseDialog = (action) => (_eventName, data) => ({
  data: {
    action,
    purpose: data.purpose,
    ...commonParams(data),
  },
});

const getReleaseId = () => (_eventName, data) => ({
  data: {
    release_id: data.releaseId,
    ...commonParams(data),
  },
});

export const releaseEntityAdded = (_eventName, data) => ({
  data: {
    asset_count: data.assetCount,
    entry_count: data.entryCount,
    release_id: data.releaseId,
    ...commonParams(data),
  },
});

export const releaseEntityRemoved = (_eventName, data) => ({
  data: {
    release_id: data.releaseId,
    entity_id: data.entityId,
    entity_type: data.entityType,
    ...commonParams(data),
  },
});

export const releaseDialogOpen = getReleaseDialog(Actions.OPEN);
export const releaseDialogClose = getReleaseDialog(Actions.CLOSE);

export const releaseCreated = getReleaseId();
export const releaseTrashed = getReleaseId();
export const releaseUnpublished = getReleaseId();

export const releaseValidated = (_eventName, data) => ({
  data: {
    release_id: data.releaseId,
    is_validated: data.isValidated,
    error_message: data.errorMessage,
    ...commonParams(data),
  },
});

export const releasePublished = (_eventName, data) => ({
  data: {
    release_id: data.releaseId,
    asset_count: data.assetCount,
    entry_count: data.entryCount,
    ...commonParams(data),
  },
});

export const releaseScheduleCreated = (_eventName, data) => ({
  data: {
    action: data.action,
    scheduled_for: data.scheduledFor,
    asset_count: data.assetCount,
    entry_count: data.entryCount,
    release_id: data.releaseId,
    job_id: data.jobId,
    ...commonParams(data),
  },
});

export const releaseScheduleCanceled = (_eventName, data) => ({
  data: {
    release_id: data.releaseId,
    job_id: data.jobId,
    ...commonParams(data),
  },
});
