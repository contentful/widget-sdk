import createResourceService from 'services/ResourceService.es6';

import * as actions from './actions.es6';

export function getResource({ spaceId, environmentId, resourceName }) {
  return async dispatch => {
    const resources = createResourceService(spaceId);
    let resource;

    dispatch(actions.resourcePending(spaceId, environmentId, resourceName, true));

    try {
      resource = await resources.get(resourceName, environmentId);
    } catch (e) {
      dispatch(actions.resourceFailure(spaceId, environmentId, resourceName, e));
      dispatch(actions.resourcePending(spaceId, environmentId, resourceName, false));

      return;
    }

    dispatch(actions.resourceSuccess(spaceId, environmentId, resourceName, resource));
    dispatch(actions.resourcePending(spaceId, environmentId, resourceName, false));
  };
}
