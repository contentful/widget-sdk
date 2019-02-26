import createResourceService from 'services/ResourceService.es6';

import * as actions from './actions.es6';

export function getResource({ spaceId, resourceName }) {
  return async dispatch => {
    const resources = createResourceService(spaceId);
    let resource;

    dispatch(actions.resourcePending(spaceId, resourceName, true));

    try {
      resource = await resources.get(resourceName);
    } catch (e) {
      dispatch(actions.resourceFailure(spaceId, resourceName, e));
      dispatch(actions.resourcePending(spaceId, resourceName, false));

      return;
    }

    dispatch(actions.resourceSuccess(spaceId, resourceName, resource));
    dispatch(actions.resourcePending(spaceId, resourceName, false));
  };
}
