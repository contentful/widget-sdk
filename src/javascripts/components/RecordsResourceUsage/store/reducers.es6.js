import * as actions from './actions';
import { get, set } from 'lodash';

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

  if (!spaceId || !resourceName) {
    return state;
  }

  function setCurrentResourceState (update) {
    const currentResourceState = get(state, `${spaceId}.${resourceName}`);
    const newResourceState = { ...currentResourceState, ...update };
    const copiedState = { ...state };

    return set(copiedState, `${spaceId}.${resourceName}`, newResourceState);
  }

  switch (action.type) {
    case actions.RESOURCE_PENDING:
      return setCurrentResourceState({ isPending: action.isPending });
    case actions.RESOURCE_FAILURE:
      return setCurrentResourceState({ error: action.error });
    case actions.RESOURCE_SUCCESS:
      return setCurrentResourceState({ value: action.value });
    default:
      return state;
  }
}
