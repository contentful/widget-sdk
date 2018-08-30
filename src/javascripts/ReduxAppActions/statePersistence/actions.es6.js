export const FETCH_USER_STATE_PENDING = 'FETCH_USER_STATE_PENDING';
export function fetchUserStatePending({ key }) {
  return {
    type: FETCH_USER_STATE_PENDING,
    payload: { key }
  };
}

export const FETCH_USER_STATE_SUCCESS = 'FETCH_USER_STATE_SUCCESS';
export function fetchUserStateSuccess({ key, data }) {
  return {
    type: FETCH_USER_STATE_SUCCESS,
    payload: { key, data }
  };
}

export const FETCH_USER_STATE_FAILURE = 'FETCH_USER_STATE_FAILURE';
export function fetchUserStateFailure({ key, error }) {
  return {
    type: FETCH_USER_STATE_FAILURE,
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

export const FETCH_USER_ENV_STATE_PENDING = 'FETCH_USER_ENV_STATE_PENDING';
export function fetchUserEnvStatePending({ key, spaceId, envId }) {
  return {
    type: FETCH_USER_ENV_STATE_PENDING,
    payload: { key, spaceId, envId }
  };
}

export const FETCH_USER_ENV_STATE_SUCCESS = 'FETCH_USER_ENV_STATE_SUCCESS';
export function fetchUserEnvStateSuccess({ key, spaceId, envId, data }) {
  return {
    type: FETCH_USER_ENV_STATE_SUCCESS,
    payload: { key, spaceId, envId, data }
  };
}

export const FETCH_USER_ENV_STATE_FAILURE = 'FETCH_USER_ENV_STATE_FAILURE';
export function fetchUserEnvStateFailure({ key, spaceId, envId, error }) {
  return {
    type: FETCH_USER_ENV_STATE_FAILURE,
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

export const FETCH_ENV_STATE_PENDING = 'FETCH_ENV_STATE_PENDING';
export function fetchEnvStatePending({ key, spaceId, envId }) {
  return {
    type: FETCH_ENV_STATE_PENDING,
    payload: { key, spaceId, envId }
  };
}

export const FETCH_ENV_STATE_SUCCESS = 'FETCH_ENV_STATE_SUCCESS';
export function fetchEnvStateSuccess({ key, spaceId, envId, data }) {
  return {
    type: FETCH_ENV_STATE_SUCCESS,
    payload: { key, spaceId, envId, data }
  };
}

export const FETCH_ENV_STATE_FAILURE = 'FETCH_ENV_STATE_FAILURE';
export function fetchEnvStateFailure({ key, spaceId, envId, error }) {
  return {
    type: FETCH_ENV_STATE_FAILURE,
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
