import * as actions from './actions.es6';
import { get, set } from 'lodash';

export default function resources(state = {}, action) {
  const { spaceId } = action;

  function setCurrentState(update) {
    const currentResourceState = get(state, `${spaceId}`);
    const newResourceState = { ...currentResourceState, ...update };
    const copiedState = { ...state };

    return set(copiedState, `${spaceId}`, newResourceState);
  }

  switch (action.type) {
    case actions.RESOURCES_FOR_SPACE_PENDING:
      return setCurrentState({ isPending: action.isPending });
    case actions.RESOURCES_FOR_SPACE_FAILURE:
      return setCurrentState({ error: action.error });
    case actions.RESOURCES_FOR_SPACE_SUCCESS:
      return setCurrentState({ value: action.value });
    default:
      return state;
  }
}
