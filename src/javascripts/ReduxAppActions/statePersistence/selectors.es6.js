import {get} from 'lodash';

export function getUserState ({ state, key }) {
  return get(state, ['statePersistence', 'user', key], {});
}

export function getUserEnvState ({ state, key, spaceId, envId }) {
  return get(state, ['statePersistence', 'userEnv', spaceId, envId, key], {});
}

export function getEnvState ({ state, key, spaceId, envId }) {
  return get(state, ['statePersistence', 'env', spaceId, envId, key], {});
}
