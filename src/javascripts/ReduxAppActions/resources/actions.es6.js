export const RESOURCES_FOR_SPACE_PENDING = 'RESOURCES_FOR_SPACE/PENDING';
export function resourcesForSpacePending (spaceId, isPending) {
  return {
    type: RESOURCES_FOR_SPACE_PENDING,
    spaceId,
    isPending
  };
}

export const RESOURCES_FOR_SPACE_FAILURE = 'RESOURCES_FOR_SPACE/FAILURE';
export function resourcesForSpaceFailure (spaceId, error) {
  return {
    type: RESOURCES_FOR_SPACE_FAILURE,
    spaceId,
    error
  };
}

export const RESOURCES_FOR_SPACE_SUCCESS = 'RESOURCES_FOR_SPACE/SUCCESS';
export function resourcesForSpaceSuccess (spaceId, resources) {
  return {
    type: RESOURCES_FOR_SPACE_SUCCESS,
    spaceId,
    resources
  };
}
