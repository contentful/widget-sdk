import { createUsersEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import * as actions from './actions';
import * as selectors from './selectors';
import { update } from './update';

/**
 * @description State persistence action creators.
 * There is a lot of duplication, but abstracting might reduce
 * readability, which I'd like to keep.
 *
 * If you need to use this service outside of react components
 * please require the whole store:
 *
 * const store = require('ReduxStore/store').default;
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
    dispatch(actions.userStatePending({ key }));

    const endpoint = createUsersEndpoint();

    try {
      const data = await endpoint(
        {
          method: 'GET',
          path: ['states', key]
        },
        {
          'x-contentful-enable-alpha-feature': 'user-state-persistence'
        }
      );

      dispatch(actions.userStateSuccess({ key, data }));

      return data;
    } catch (error) {
      dispatch(actions.userStateFailure({ key, error }));
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
      fetch: data => {
        const endpoint = createUsersEndpoint();
        return endpoint(
          {
            method: 'PUT',
            path: ['states', key],
            data
          },
          {
            'x-contentful-enable-alpha-feature': 'user-state-persistence'
          }
        );
      },
      key: `user:${key}`,
      payload
    });
  };
}

export function fetchUserEnvState({ key, spaceId, envId }) {
  return async dispatch => {
    dispatch(actions.userEnvStatePending({ key, spaceId, envId }));

    const endpoint = createSpaceEndpoint(spaceId, envId);

    try {
      const data = await endpoint(
        {
          method: 'GET',
          path: ['user_states', key]
        },
        {
          'x-contentful-enable-alpha-feature': 'user-state-persistence'
        }
      );

      dispatch(actions.userEnvStateSuccess({ key, spaceId, envId, data }));

      return data;
    } catch (error) {
      dispatch(actions.userEnvStateFailure({ key, spaceId, envId, error }));
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
      fetch: data => {
        const endpoint = createSpaceEndpoint(spaceId, envId);
        return endpoint(
          {
            method: 'PUT',
            path: ['user_states', key],
            data
          },
          {
            'x-contentful-enable-alpha-feature': 'user-state-persistence'
          }
        );
      },
      key: `user_env:${spaceId}:${envId}:${key}`,
      payload
    });
  };
}

export function fetchEnvState({ key, spaceId, envId }) {
  return async dispatch => {
    dispatch(actions.envStatePending({ key, spaceId, envId }));

    try {
      const endpoint = createSpaceEndpoint(spaceId, envId);

      const data = await endpoint(
        {
          method: 'GET',
          path: ['user_states', key]
        },
        {
          'x-contentful-enable-alpha-feature': 'user-state-persistence'
        }
      );

      dispatch(actions.envStateSuccess({ key, spaceId, envId, data }));

      return data;
    } catch (error) {
      dispatch(actions.envStateFailure({ key, spaceId, envId, error }));
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
      fetch: data => {
        const endpoint = createSpaceEndpoint(spaceId, envId);
        return endpoint(
          {
            method: 'PUT',
            path: ['states', key],
            data
          },
          {
            'x-contentful-enable-alpha-feature': 'user-state-persistence'
          }
        );
      },
      key: `env:${spaceId}:${envId}:${key}`,
      payload
    });
  };
}
