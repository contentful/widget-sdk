import * as LD from 'utils/LaunchDarkly';
import createResourceService from 'services/ResourceService';

import * as actions from './actions';

export function getIncentivizingFlag() {
  return async dispatch => {
    const flagName = 'feature-bv-06-2018-incentivize-upgrade';
    let status;

    try {
      status = await LD.getCurrentVariation(flagName);
    } catch (e) {
      // If there is an error, set the flag to false
      dispatch(actions.incentivizeUpgradeEnabled(false));
    }

    dispatch(actions.incentivizeUpgradeEnabled(status));
  };
}

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
