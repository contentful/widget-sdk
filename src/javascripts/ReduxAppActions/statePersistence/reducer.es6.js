import { combineReducers } from 'redux';

/**
 * Structure:
 * {
 *   user: {
 *     [key]: {
 *       isPending: false,
 *       error: null, // fetching error
 *       isUpdating: false,
 *       updatingError: null, // updating error
 *       data: {}
 *     }
 *   },
 *   userEnv: {
 *     [spaceId]: {
 *       [envId]: {
 *         [key]: {
 *           isPending: false,
 *           error: null, // fetching error
 *           isUpdating: false,
 *           updatingError: null, // updating error
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
 * One important thing to note is that we never remove the data.
 * For example, when you have some data, and you fetch once again, it raises
 * `isPending` flag, but `data` field stays intact. After fetch is complete,
 * it will update `data` field. However, it is not really expected to receive
 * a new value (in case you already fetched data).
 *
 * Another thing is how update works. When you update a value, it immediately
 * updates `data` property, and tries to send a request. If an update request
 * is in progress, if we send the second one immediately, we'll get a conflict.
 * So we will wait for it, and apply new data. In case the request fails, it will
 * rollback to the previous data.
 *
 * This behaviour is correct for all types (user, userEnv, env)
 */

import * as actions from './actions';

export default combineReducers({
  user: userStateReducer,
  userEnv: userEnvStateReducer,
  env: envStateReducer
});

function updateUserState({ state, key, newData }) {
  const currentData = state[key];
  return {
    ...state,
    [key]: {
      ...currentData,
      ...newData
    }
  };
}

function userStateReducer(state = {}, action) {
  switch (action.type) {
    case actions.USER_STATE_PENDING: {
      return updateUserState({
        key: action.payload.key,
        state,
        newData: {
          isPending: true,
          error: null
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
    case actions.USER_STATE_FAILURE: {
      return updateUserState({
        key: action.payload.key,
        state,
        newData: {
          isPending: false,
          error: action.payload.error
        }
      });
    }
    case actions.UPDATE_USER_STATE_PENDING: {
      return updateUserState({
        key: action.payload.key,
        state,
        newData: {
          isUpdating: true,
          data: action.payload.data,
          updatingError: null
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
    case actions.UPDATE_USER_STATE_FAILURE: {
      return updateUserState({
        key: action.payload.key,
        state,
        newData: {
          isUpdating: false,
          updatingError: action.payload.error,
          // we rollback to the previous data
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
function updateEnvState({ state, payload, newData }) {
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

function userEnvStateReducer(state = {}, action) {
  switch (action.type) {
    case actions.USER_ENV_STATE_PENDING: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isPending: true,
          error: null
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
    case actions.USER_ENV_STATE_FAILURE: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isPending: false,
          error: action.payload.error
        }
      });
    }
    case actions.UPDATE_USER_ENV_STATE_PENDING: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isUpdating: true,
          data: action.payload.data,
          updatingError: null
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
    case actions.UPDATE_USER_ENV_STATE_FAILURE: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isUpdating: false,
          updatingError: action.payload.error,
          data: action.payload.data
        }
      });
    }
    default:
      return state;
  }
}

function envStateReducer(state = {}, action) {
  switch (action.type) {
    case actions.ENV_STATE_PENDING: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isPending: true,
          error: null
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
    case actions.ENV_STATE_FAILURE: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isPending: false,
          error: action.payload.error
        }
      });
    }
    case actions.UPDATE_ENV_STATE_PENDING: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isUpdating: true,
          updatingError: null,
          data: action.payload.data
        }
      });
    }
    case actions.UPDATE_ENV_STATE_SUCCESS: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isUpdating: false,
          data: action.payload.data
        }
      });
    }
    case actions.UPDATE_ENV_STATE_FAILURE: {
      return updateEnvState({
        state,
        payload: action.payload,
        newData: {
          isUpdating: false,
          updatingError: action.payload.error,
          data: action.payload.data
        }
      });
    }
    default:
      return state;
  }
}
