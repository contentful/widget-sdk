import {createUsersEndpoint, createSpaceEndpoint} from 'data/EndpointFactory';
import * as actions from './actions';

// We keep all references to the requests in progress
// if they are in progress, we save new data
// after original update requests are done, we take these new values
// and make a new request. We also always return a promise which
// is resolved as soon as _all_ requests have succeeded.
const values = {};

// update state persistence API. if request is in progress, we'll save
// the new data, and update once again after original request is done.
function update (args) {
  const { params, setPending, setSuccess, fetch, key, payload } = args;

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
    });
  }
}

export function fetchUserState ({ key }) {
  return async dispatch => {
    dispatch(actions.userStatePending({ key }));

    const endpoint = createUsersEndpoint();

    const data = await endpoint({
      method: 'GET',
      path: ['states']
    }, {
      'x-contentful-enable-alpha-feature': 'user-state-persistence'
    });

    dispatch(actions.userStateSuccess({ key, data }));

    return data;
  };
}

export function updateUserState (params) {
  const { key, payload } = params;
  return async dispatch => {
    return update({
      params,
      setPending: () => dispatch(actions.updateUserStatePending({ key, data: payload })),
      setSuccess: (data) => dispatch(actions.updateUserStateSuccess({ key, data })),
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

    const data = await endpoint({
      method: 'GET',
      path: ['user_states', key]
    }, {
      'x-contentful-enable-alpha-feature': 'user-state-persistence'
    });

    dispatch(actions.userEnvStateSuccess({ key, spaceId, envId, data }));

    return data;
  };
}

export function updateUserEnvState (params) {
  const { key, spaceId, envId, payload } = params;
  return async dispatch => {
    return update({
      params,
      setPending: () => dispatch(actions.updateUserEnvStatePending({ key, spaceId, envId, data: payload })),
      setSuccess: (data) => dispatch(actions.updateUserEnvStateSuccess({ key, spaceId, envId, data })),
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

    const endpoint = createSpaceEndpoint(spaceId, envId);

    const data = await endpoint({
      method: 'GET',
      path: ['user_states', key]
    }, {
      'x-contentful-enable-alpha-feature': 'user-state-persistence'
    });

    dispatch(actions.envStateSuccess({ key, spaceId, envId, data }));

    return data;
  };
}

export function updateEnvState (params) {
  const { key, spaceId, envId, payload } = params;
  return async dispatch => {
    return update({
      params,
      setPending: () => dispatch(actions.updateEnvStatePending({ key, spaceId, envId, data: payload })),
      setSuccess: (data) => dispatch(actions.updateEnvStateSuccess({ key, spaceId, envId, data })),
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
