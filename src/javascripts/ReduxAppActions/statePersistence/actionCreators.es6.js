import {createUsersEndpoint, createSpaceEndpoint} from 'data/EndpointFactory';
import * as actions from './actions';
import * as selectors from './selectors';

// We keep all references to the requests in progress
// if they are in progress, we save new data
// after original update requests are done, we take these new values
// and make a new request. We also always return a promise which
// is resolved as soon as _all_ requests have succeeded.
const values = {};

// update state persistence API. if request is in progress, we'll save
// the new data, and update once again after original request is done.
function update (args) {
  const { params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData } = args;

  if (!values[key]) {
    values[key] = {};
  }

  const { promise } = values[key];

  if (promise) {
    values[key].value = params;
    let resolveFn;
    const newPromise = new Promise(resolve => {
      resolveFn = resolve;
    });

    values[key].promises.push(resolveFn);

    return newPromise;
  } else {
    // if we have a promise, we don't need to set it up
    setPending(params);
    const newPromise = fetch(payload);
    values[key] = {
      promise: newPromise,
      promises: []
    };

    return newPromise.then(newValue => {
      const { value, promises } = values[key];

      // you can write only JSON to the service
      // so value has to be an object
      if (value) {
        const valueWithSys = {
          ...value,
          sys: newValue.sys
        };

        // we need to remove value, since we are performing another request
        // with this value. If new request will come up, we'll end up here again
        // otherwise, we don't need it. All promises still have to be resolved
        // after all values being pushed to the server
        values[key].value = null;

        return update({
          ...args,
          // we update fallbackData, since it is the latest successfull data
          // so in case the next request fails, we will rollback to the latest
          // reply from the server
          fallbackData: newValue,
          payload: valueWithSys
        });
      } else {
        setSuccess(newValue);
        promises.forEach(fn => fn(newValue));

        // dump all data for this key
        // next update will start it again
        values[key] = null;

        return newValue;
      }
    }, error => {
      const { value, promises } = values[key];

      // even we have an error, it is fine – we can try to write the next data
      // without changing sys property (since server failed to )
      if (value) {
        values[key].value = null;
        return update({
          ...args,
          payload: value
        });
      } else {
        setFailure({ error, fallbackData });
        promises.forEach(fn => fn(null));
      }
    });
  }
}

export function fetchUserState ({ key }) {
  return async dispatch => {
    dispatch(actions.userStatePending({ key }));

    const endpoint = createUsersEndpoint();

    try {
      const data = await endpoint({
        method: 'GET',
        path: ['states', key]
      }, {
        'x-contentful-enable-alpha-feature': 'user-state-persistence'
      });

      dispatch(actions.userStateSuccess({ key, data }));

      return data;
    } catch (error) {
      dispatch(actions.userStateFailure({ key, error }));
    }
  };
}

export function updateUserState (params) {
  const { key, payload } = params;
  return async (dispatch, getState) => {
    const { data } = selectors.getUserState({ state: getState(), key });
    return update({
      params,
      fallbackData: data,
      setPending: () => dispatch(actions.updateUserStatePending({ key, data: payload })),
      setSuccess: (data) => dispatch(actions.updateUserStateSuccess({ key, data })),
      setFailure: ({ error, fallbackData }) => dispatch(actions.updateUserStateFailure({ key, error, data: fallbackData })),
      fetch: data => {
        const endpoint = createUsersEndpoint();
        return endpoint({
          method: 'PUT',
          path: ['states', key],
          data
        }, {
          'x-contentful-enable-alpha-feature': 'user-state-persistence'
        });
      },
      key: `user:${key}`,
      payload
    });
  };
}

export function fetchUserEnvState ({ key, spaceId, envId }) {
  return async dispatch => {
    dispatch(actions.userEnvStatePending({ key, spaceId, envId }));

    const endpoint = createSpaceEndpoint(spaceId, envId);

    try {
      const data = await endpoint({
        method: 'GET',
        path: ['user_states', key]
      }, {
        'x-contentful-enable-alpha-feature': 'user-state-persistence'
      });

      dispatch(actions.userEnvStateSuccess({ key, spaceId, envId, data }));

      return data;
    } catch (error) {
      dispatch(actions.userEnvStateFailure({ key, spaceId, envId, error }));
    }
  };
}

export function updateUserEnvState (params) {
  const { key, spaceId, envId, payload } = params;
  return async (dispatch, getState) => {
    const { data } = selectors.getUserEnvState({ state: getState(), key, spaceId, envId });
    return update({
      params,
      fallbackData: data,
      setPending: () => dispatch(actions.updateUserEnvStatePending({ key, spaceId, envId, data: payload })),
      setSuccess: (data) => dispatch(actions.updateUserEnvStateSuccess({ key, spaceId, envId, data })),
      setFailure: ({ error, fallbackData }) => dispatch(actions.updateUserEnvStateFailure({ key, spaceId, envId, error, data: fallbackData })),
      fetch: data => {
        const endpoint = createSpaceEndpoint(spaceId, envId);
        return endpoint({
          method: 'PUT',
          path: ['user_states', key],
          data
        }, {
          'x-contentful-enable-alpha-feature': 'user-state-persistence'
        });
      },
      key: `user_env:${spaceId}:${envId}:${key}`,
      payload
    });
  };
}

export function fetchEnvState ({ key, spaceId, envId }) {
  return async dispatch => {
    dispatch(actions.envStatePending({ key, spaceId, envId }));

    try {
      const endpoint = createSpaceEndpoint(spaceId, envId);

      const data = await endpoint({
        method: 'GET',
        path: ['user_states', key]
      }, {
        'x-contentful-enable-alpha-feature': 'user-state-persistence'
      });

      dispatch(actions.envStateSuccess({ key, spaceId, envId, data }));

      return data;
    } catch (error) {
      dispatch(actions.envStateFailure({ key, spaceId, envId, error }));
    }
  };
}

export function updateEnvState (params) {
  const { key, spaceId, envId, payload } = params;
  return async (dispatch, getState) => {
    const { data } = selectors.getEnvState({ state: getState(), key, spaceId, envId });
    return update({
      params,
      fallbackData: data,
      setPending: () => dispatch(actions.updateEnvStatePending({ key, spaceId, envId, data: payload })),
      setSuccess: (data) => dispatch(actions.updateEnvStateSuccess({ key, spaceId, envId, data })),
      setFailure: ({ error, fallbackData }) => dispatch(actions.updateEnvStateFailure({ key, spaceId, envId, error, data: fallbackData })),
      fetch: data => {
        const endpoint = createSpaceEndpoint(spaceId, envId);
        return endpoint({
          method: 'PUT',
          path: ['states', key],
          data
        }, {
          'x-contentful-enable-alpha-feature': 'user-state-persistence'
        });
      },
      key: `env:${spaceId}:${envId}:${key}`,
      payload
    });
  };
}
