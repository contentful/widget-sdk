export const RESOURCE_PENDING = 'RESOURCE/PENDING';
export function resourcePending(spaceId, resourceName, isPending) {
  return {
    type: RESOURCE_PENDING,
    spaceId,
    resourceName,
    isPending
  };
}

export const RESOURCE_FAILURE = 'RESOURCE/FAILURE';
export function resourceFailure(spaceId, resourceName, error) {
  return {
    type: RESOURCE_FAILURE,
    spaceId,
    resourceName,
    error
  };
}

export const RESOURCE_SUCCESS = 'RESOURCE/SUCCESS';
export function resourceSuccess(spaceId, resourceName, value) {
  return {
    type: RESOURCE_SUCCESS,
    spaceId,
    resourceName,
    value
  };
}
