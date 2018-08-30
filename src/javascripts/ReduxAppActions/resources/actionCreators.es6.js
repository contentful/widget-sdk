import createResourceService from 'services/ResourceService.es6';

import * as actions from './actions.es6';

export function getResourcesForSpace(spaceId) {
  return async dispatch => {
    const resourceService = createResourceService(spaceId);
    let resources;

    dispatch(actions.resourcesForSpacePending(spaceId, true));

    try {
      resources = await resourceService.getAll();
    } catch (e) {
      dispatch(actions.resourcesForSpaceFailure(spaceId, e));
      dispatch(actions.resourcesForSpacePending(spaceId, false));

      return;
    }

    dispatch(actions.resourcesForSpaceSuccess(spaceId, resources));
    dispatch(actions.resourcesForSpacePending(spaceId, false));
  };
}
