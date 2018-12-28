import { createUsersEndpoint, createSpaceEndpoint } from 'data/EndpointFactory.es6';
import * as actions from './actions.es6';
import * as selectors from 'redux/selectors/statePersistence.es6';
import { update } from './update.es6';

// since it is an internal API, we require alpha headers
// for all endpoints with state persistence
const alphaHeaders = {
  'x-contentful-enable-alpha-feature': 'state-persistence'
};

/**
 * @description State persistence action creators.
 * There is a lot of duplication, but abstracting might reduce
 * readability, which I'd like to keep.
 *
 * If you need to use this service outside of react components
 * please require the whole store:
 *
 * const store = require('redux/store').default;
 *
 * ...
 * await store.dispatch(actions.fetchUserState({ key: 'your_feature' }));
 * selectors.getUserState({ state: store.getState(), key: 'your_feature' });
 *
 * The reason for that is that updating has a pretty specific logic inside,
 * and fetching might get some in the future. If you find yourself writing
 * lines on top too often, feel free to abstract them.
 */

export function fetchUserState({ key }) {
  return async dispatch => {
    dispatch(actions.fetchUserStatePending({ key }));

    const endpoint = createUsersEndpoint();

    try {
      const data = await endpoint(
        {
          method: 'GET',
          path: ['states', key]
        },
        alphaHeaders
      );

      dispatch(actions.fetchUserStateSuccess({ key, data }));

      return data;
    } catch (error) {
      dispatch(actions.fetchUserStateFailure({ key, error }));
    }
  };
}

export function updateUserState(params) {
  const { key, payload } = params;
  return async (dispatch, getState) => {
    const { data } = selectors.getUserState({ state: getState(), key });
    return update({
      params,
      fallbackData: data,
      setPending: () => dispatch(actions.updateUserStatePending({ key, data: payload })),
      setSuccess: data => dispatch(actions.updateUserStateSuccess({ key, data })),
      setFailure: ({ error, fallbackData }) =>
        dispatch(actions.updateUserStateFailure({ key, error, data: fallbackData })),
      makeRequest: data => {
        const endpoint = createUsersEndpoint();
        return endpoint(
          {
            method: 'PUT',
            path: ['states', key],
            data
          },
          alphaHeaders
        );
      },
      key: `user:${key}`,
      payload
    });
  };
}

export function fetchUserEnvState({ key, spaceId, envId }) {
  return async dispatch => {
    dispatch(actions.fetchUserEnvStatePending({ key, spaceId, envId }));

    const endpoint = createSpaceEndpoint(spaceId, envId);

    try {
      const data = await endpoint(
        {
          method: 'GET',
          path: ['user_states', key]
        },
        alphaHeaders
      );

      dispatch(actions.fetchUserEnvStateSuccess({ key, spaceId, envId, data }));

      return data;
    } catch (error) {
      dispatch(actions.fetchUserEnvStateFailure({ key, spaceId, envId, error }));
    }
  };
}

export function updateUserEnvState(params) {
  const { key, spaceId, envId, payload } = params;
  return async (dispatch, getState) => {
    const { data } = selectors.getUserEnvState({ state: getState(), key, spaceId, envId });
    return update({
      params,
      fallbackData: data,
      setPending: () =>
        dispatch(actions.updateUserEnvStatePending({ key, spaceId, envId, data: payload })),
      setSuccess: data =>
        dispatch(actions.updateUserEnvStateSuccess({ key, spaceId, envId, data })),
      setFailure: ({ error, fallbackData }) =>
        dispatch(
          actions.updateUserEnvStateFailure({ key, spaceId, envId, error, data: fallbackData })
        ),
      makeRequest: data => {
        const endpoint = createSpaceEndpoint(spaceId, envId);
        return endpoint(
          {
            method: 'PUT',
            path: ['user_states', key],
            data
          },
          alphaHeaders
        );
      },
      key: `user_env:${spaceId}:${envId}:${key}`,
      payload
    });
  };
}

export function fetchEnvState({ key, spaceId, envId }) {
  return async dispatch => {
    dispatch(actions.fetchEnvStatePending({ key, spaceId, envId }));

    try {
      const endpoint = createSpaceEndpoint(spaceId, envId);

      const data = await endpoint(
        {
          method: 'GET',
          path: ['user_states', key]
        },
        alphaHeaders
      );

      dispatch(actions.fetchEnvStateSuccess({ key, spaceId, envId, data }));

      return data;
    } catch (error) {
      dispatch(actions.fetchEnvStateFailure({ key, spaceId, envId, error }));
    }
  };
}

export function updateEnvState(params) {
  const { key, spaceId, envId, payload } = params;
  return async (dispatch, getState) => {
    const { data } = selectors.getEnvState({ state: getState(), key, spaceId, envId });
    return update({
      params,
      fallbackData: data,
      setPending: () =>
        dispatch(actions.updateEnvStatePending({ key, spaceId, envId, data: payload })),
      setSuccess: data => dispatch(actions.updateEnvStateSuccess({ key, spaceId, envId, data })),
      setFailure: ({ error, fallbackData }) =>
        dispatch(actions.updateEnvStateFailure({ key, spaceId, envId, error, data: fallbackData })),
      makeRequest: data => {
        const endpoint = createSpaceEndpoint(spaceId, envId);
        return endpoint(
          {
            method: 'PUT',
            path: ['states', key],
            data
          },
          alphaHeaders
        );
      },
      key: `env:${spaceId}:${envId}:${key}`,
      payload
    });
  };
}
