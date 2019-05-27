export const RESOURCE_PENDING = 'RESOURCE/PENDING';
export function resourcePending(spaceId, environmentId, resourceName, isPending) {
  return {
    type: RESOURCE_PENDING,
    spaceId,
    environmentId,
    resourceName,
    isPending
  };
}

export const RESOURCE_FAILURE = 'RESOURCE/FAILURE';
export function resourceFailure(spaceId, environmentId, resourceName, error) {
  return {
    type: RESOURCE_FAILURE,
    spaceId,
    environmentId,
    resourceName,
    error
  };
}

export const RESOURCE_SUCCESS = 'RESOURCE/SUCCESS';
export function resourceSuccess(spaceId, environmentId, resourceName, value) {
  return {
    type: RESOURCE_SUCCESS,
    spaceId,
    environmentId,
    resourceName,
    value
  };
}
