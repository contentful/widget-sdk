import {createUsersEndpoint, createSpaceEndpoint} from 'data/EndpointFactory';
import * as actions from './actions';

export function fetchUserState ({ key }) {
  return async dispatch => {
    dispatch(actions.userStatePending({ key }));

    const endpoint = createUsersEndpoint();

    const data = await endpoint({
      method: 'GET',
      path: ['states']
    });

    dispatch(actions.userStateSuccess({ key, data }));
  };
}

export function updateUserState ({ key, payload }) {
  return async dispatch => {
    dispatch(actions.updateUserStatePending({ key, data: payload }));

    const endpoint = createUsersEndpoint();
    const data = await endpoint({
      method: 'PUT',
      path: ['states', key],
      data: payload
    });

    dispatch(actions.updateUserStateSuccess({ key, data }));
  };
}

export function fetchUserEnvState ({ key, spaceId, envId }) {
  return async dispatch => {
    dispatch(actions.userEnvStatePending({ key, spaceId, envId }));

    const endpoint = createSpaceEndpoint(spaceId, envId);

    const data = await endpoint({
      method: 'GET',
      path: ['user_states', key]
    });

    dispatch(actions.userEnvStateSuccess({ key, spaceId, envId, data }));
  };
}

export function updateUserEnvState ({ key, spaceId, envId, payload }) {
  return async dispatch => {
    dispatch(actions.updateUserEnvStatePending({ key, spaceId, envId, data: payload }));

    const endpoint = createSpaceEndpoint(spaceId, envId);

    const data = await endpoint({
      method: 'PUT',
      path: ['user_states', key],
      data: payload
    });

    dispatch(actions.updateUserEnvStateSuccess({ key, spaceId, envId, data }));
  };
}

export function fetchEnvState ({ key, spaceId, envId }) {
  return async dispatch => {
    dispatch(actions.envStatePending({ key, spaceId, envId }));

    const endpoint = createSpaceEndpoint(spaceId, envId);

    const data = await endpoint({
      method: 'GET',
      path: ['user_states', key]
    });

    dispatch(actions.envStateSuccess({ key, spaceId, envId, data }));
  };
}

export function updateEnvState ({ key, spaceId, envId, payload }) {
  return async dispatch => {
    dispatch(actions.updateEnvStatePending({ key, spaceId, envId, data: payload }));

    const endpoint = createSpaceEndpoint(spaceId, envId);

    const data = await endpoint({
      method: 'PUT',
      path: ['user_states', key],
      data: payload
    });

    dispatch(actions.updateEnvStateSuccess({ key, spaceId, envId, data }));
  };
}
