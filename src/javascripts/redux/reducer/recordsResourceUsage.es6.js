import produce from 'immer';
import { combineReducers } from 'redux';
import { set } from 'lodash';

import * as actions from '../actions/recordsResourceUsage/actions.es6';

const incentivizeUpgradeEnabled = produce((_, action) => {
  if (action.type === actions.RECORDS_RESOURCE_INCENTIVIZE_ENABLED) {
    return action.isEnabled;
  }
}, false);

const resources = produce((state, action) => {
  const { spaceId, resourceName } = action;

  if (!spaceId || !resourceName) {
    return;
  }

  function setCurrentResourceState(key, value) {
    set(state, [spaceId, resourceName, key], value);
  }

  switch (action.type) {
    case actions.RESOURCE_PENDING:
      setCurrentResourceState('isPending', action.isPending);
      return;
    case actions.RESOURCE_FAILURE:
      setCurrentResourceState('error', action.error);
      return;
    case actions.RESOURCE_SUCCESS:
      setCurrentResourceState('value', action.value);
      return;
  }
}, {});

export default combineReducers({
  incentivizeUpgradeEnabled,
  resources
});
