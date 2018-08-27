import { combineReducers } from 'redux';

/**
 * Structure:
 * {
 *   user: {
 *     [key]: {
 *       isPending: false
 *       isUpdating: false
 *       data: {}
 *     }
 *   },
 *   userEnv: {
 *     [spaceId]: {
 *       [envId]: {
 *         [key]: {
 *           isPending: false,
 *           isUpdating: false,
 *           data: {}
 *         }
 *       }
 *     }
 *   },
 *   env: {
 *     // same as userEnv //
 *   }
 * }
 *
 * One important thing is that there are no errors in this reducer.
 * It is not a mistake – one requirement for the state persistence API
 * is that it is *not* crucial for the webapp – so if it is unavailable,
 * the webapp should work just fine. All API errors should be handled
 * in actionCreators and fallback to the localStorage in these cases.
 *
 * isPending and isUpdating are subject to change and might be merged together
 * in the future.
 * isPending is about fetching the data, and isUpdating is about updating a key
 * when we update something, in a positive scenario we will receive the same data
 * back, except with an updated version and `updatedAt` field
 */

import * as actions from './actions';

export default combineReducers({
  user: userStateReducer,
  userEnv: userEnvStateReducer,
  env: envStateReducer
});

function updateUserState ({ state, key, newData }) {
  const currentData = state[key];
  return {
    ...state,
    [key]: {
      ...currentData,
      ...newData
    }
  };
}

function userStateReducer (state = {}, action) {
  switch (action.type) {
    case actions.USER_STATE_PENDING: {
      return updateUserState({
        key: action.payload.key,
        state,
        newData: {
          isPending: true
        }
      });
    }
    case actions.USER_STATE_SUCCESS: {
      return updateUserState({
        key: action.payload.key,
        state,
        newData: {
          isPending: false,
          data: action.payload.data
        }
      });
    }
    case actions.UPDATE_USER_STATE_PENDING: {
      return updateUserState({
        key: action.payload.key,
        state,
        newData: {
          isUpdating: true,
          data: action.payload.data
        }
      });
    }
    case actions.UPDATE_USER_STATE_SUCCESS: {
      return updateUserState({
        key: action.payload.key,
        state,
        newData: {
          isUpdating: false,
          data: action.payload.data
        }
      });
    }
    default:
      return state;
  }
}

// common envState and userEnvState share the same
// reducer structure, so they use this updater
function updateEnvState ({ state, payload, newData }) {
  const { key, spaceId, envId } = payload;
  const currentSpaceData = state[spaceId] || {};
  const currentEnvData = currentSpaceData[envId] || {};
  const currentKeyData = currentEnvData[key];
  return {
    ...state,
    [spaceId]: {
      ...currentSpaceData,
      [envId]: {
        ...currentEnvData,
        [key]: {
          ...currentKeyData,
          ...newData
        }
      }
    }
  };
}

function userEnvStateReducer (state = {}, action) {
  switch (action.type) {
    case actions.USER_ENV_STATE_PENDING: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isPending: true
        }
      });
    }
    case actions.USER_ENV_STATE_SUCCESS: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isPending: false,
          data: action.payload.data
        }
      });
    }
    case actions.UPDATE_USER_ENV_STATE_PENDING: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isUpdating: true,
          data: action.payload.data
        }
      });
    }
    case actions.UPDATE_USER_ENV_STATE_SUCCESS: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isUpdating: false,
          data: action.payload.data
        }
      });
    }
    default:
      return state;
  }
}

function envStateReducer (state = {}, action) {
  switch (action.type) {
    case actions.ENV_STATE_PENDING: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isPending: true
        }
      });
    }
    case actions.ENV_STATE_SUCCESS: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isPending: false,
          data: action.payload.data
        }
      });
    }
    case actions.UPDATE_ENV_PENDING: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isUpdating: true,
          data: action.payload.data
        }
      });
    }
    case actions.UPDATE_ENV_SUCCESS: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isUpdating: false,
          data: action.payload.data
        }
      });
    }
    default:
      return state;
  }
}
