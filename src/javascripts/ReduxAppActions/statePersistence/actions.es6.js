export const USER_STATE_PENDING = 'USER_STATE_PENDING';
export function userStatePending({ key }) {
  return {
    type: USER_STATE_PENDING,
    payload: { key }
  };
}

export const USER_STATE_SUCCESS = 'USER_STATE_SUCCESS';
export function userStateSuccess({ key, data }) {
  return {
    type: USER_STATE_SUCCESS,
    payload: { key, data }
  };
}

export const USER_STATE_FAILURE = 'USER_STATE_FAILURE';
export function userStateFailure({ key, error }) {
  return {
    type: USER_STATE_FAILURE,
    payload: { key, error }
  };
}

export const UPDATE_USER_STATE_PENDING = 'UPDATE_USER_STATE_PENDING';
export function updateUserStatePending({ key, data }) {
  return {
    type: UPDATE_USER_STATE_PENDING,
    payload: { key, data }
  };
}

export const UPDATE_USER_STATE_SUCCESS = 'UPDATE_USER_STATE_SUCCESS';
export function updateUserStateSuccess({ key, data }) {
  return {
    type: UPDATE_USER_STATE_SUCCESS,
    payload: { key, data }
  };
}

export const UPDATE_USER_STATE_FAILURE = 'UPDATE_USER_STATE_FAILURE';
export function updateUserStateFailure({ key, error, data }) {
  return {
    type: UPDATE_USER_STATE_FAILURE,
    payload: { key, error, data }
  };
}

export const USER_ENV_STATE_PENDING = 'USER_ENV_STATE_PENDING';
export function userEnvStatePending({ key, spaceId, envId }) {
  return {
    type: USER_ENV_STATE_PENDING,
    payload: { key, spaceId, envId }
  };
}

export const USER_ENV_STATE_SUCCESS = 'USER_ENV_STATE_SUCCESS';
export function userEnvStateSuccess({ key, spaceId, envId, data }) {
  return {
    type: USER_ENV_STATE_SUCCESS,
    payload: { key, spaceId, envId, data }
  };
}

export const USER_ENV_STATE_FAILURE = 'USER_ENV_STATE_FAILURE';
export function userEnvStateFailure({ key, spaceId, envId, error }) {
  return {
    type: USER_ENV_STATE_FAILURE,
    payload: { key, spaceId, envId, error }
  };
}

export const UPDATE_USER_ENV_STATE_PENDING = 'UPDATE_USER_ENV_PENDING';
export function updateUserEnvStatePending({ key, spaceId, envId, data }) {
  return {
    type: UPDATE_USER_ENV_STATE_PENDING,
    payload: { key, spaceId, envId, data }
  };
}

export const UPDATE_USER_ENV_STATE_SUCCESS = 'UPDATE_USER_ENV_SUCCESS';
export function updateUserEnvStateSuccess({ key, spaceId, envId, data }) {
  return {
    type: UPDATE_USER_ENV_STATE_SUCCESS,
    payload: { key, spaceId, envId, data }
  };
}

export const UPDATE_USER_ENV_STATE_FAILURE = 'UPDATE_USER_ENV_STATE_FAILURE';
export function updateUserEnvStateFailure({ key, spaceId, envId, error, data }) {
  return {
    type: UPDATE_USER_ENV_STATE_FAILURE,
    payload: { key, spaceId, envId, error, data }
  };
}

export const ENV_STATE_PENDING = 'ENV_STATE_PENDING';
export function envStatePending({ key, spaceId, envId }) {
  return {
    type: ENV_STATE_PENDING,
    payload: { key, spaceId, envId }
  };
}

export const ENV_STATE_SUCCESS = 'ENV_STATE_SUCCESS';
export function envStateSuccess({ key, spaceId, envId, data }) {
  return {
    type: ENV_STATE_SUCCESS,
    payload: { key, spaceId, envId, data }
  };
}

export const ENV_STATE_FAILURE = 'ENV_STATE_FAILURE';
export function envStateFailure({ key, spaceId, envId, error }) {
  return {
    type: ENV_STATE_FAILURE,
    payload: { key, spaceId, envId, error }
  };
}

export const UPDATE_ENV_STATE_PENDING = 'UPDATE_ENV_STATE_PENDING';
export function updateEnvStatePending({ key, spaceId, envId, data }) {
  return {
    type: UPDATE_ENV_STATE_PENDING,
    payload: { key, spaceId, envId, data }
  };
}

export const UPDATE_ENV_STATE_SUCCESS = 'UPDATE_ENV_STATE_SUCCESS';
export function updateEnvStateSuccess({ key, spaceId, envId, data }) {
  return {
    type: UPDATE_ENV_STATE_SUCCESS,
    payload: { key, spaceId, envId, data }
  };
}

export const UPDATE_ENV_STATE_FAILURE = 'UPDATE_ENV_STATE_FAILURE';
export function updateEnvStateFailure({ key, spaceId, envId, error, data }) {
  return {
    type: UPDATE_ENV_STATE_FAILURE,
    payload: { key, spaceId, envId, error, data }
  };
}
