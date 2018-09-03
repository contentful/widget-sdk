// there is only DELETE success handler. the reason is that the core logic
// is located into data/CMA/SpaceEnvironmentsRepo
// this is exposed for the statePersistence redux module
// feel free to extend it.

export const DELETE_ENVIRONMENT_SUCCESS = 'DELETE_ENVIRONMENT_SUCCESS';
export function deleteEnvironmentSuccess({ spaceId, envId }) {
  return {
    type: DELETE_ENVIRONMENT_SUCCESS,
    payload: { spaceId, envId }
  };
}
