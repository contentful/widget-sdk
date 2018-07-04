import * as actions from './actions';
import { set } from 'lodash';

export function incentivizeUpgradeEnabled (state = false, action) {
  switch (action.type) {
    case actions.RECORDS_RESOURCE_INCENTIVIZE_ENABLED:
      return action.isEnabled;
    default:
      return state;
  }
}

export function resources (state = {}, action) {
  const { spaceId, resourceName } = action;
  const newResourceState = set({}, `${spaceId}.${resourceName}`, {});

  switch (action.type) {
    case actions.RESOURCE_PENDING:
      newResourceState.isPending = action.isPending;
      return Object.assign({}, state, newResourceState);
    case actions.RESOURCE_FAILURE:
      newResourceState.error = action.error;
      return Object.assign({}, state, newResourceState);
    case actions.RESOURCE_SUCCESS:
      newResourceState.resource = action.resource;
      return Object.assign({}, state, newResourceState);
    default:
      return state;
  }
}
