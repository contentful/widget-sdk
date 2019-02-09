import produce from 'immer';
import { set } from 'lodash';
import * as actions from '../actions/resources/actions.es6';

const initialState = {};

export default produce((state, action) => {
  const spaceId = action.spaceId;
  if (!spaceId) {
    return;
  }

  switch (action.type) {
    case actions.RESOURCES_FOR_SPACE_PENDING:
      set(state, [spaceId, 'isPending'], action.isPending);
      return;
    case actions.RESOURCES_FOR_SPACE_FAILURE:
      set(state, [spaceId, 'error'], action.error);
      return;
    case actions.RESOURCES_FOR_SPACE_SUCCESS:
      set(state, [spaceId, 'value'], action.value);

      return;
  }
}, initialState);
