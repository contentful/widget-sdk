import { get } from 'lodash';
import { makeEnvKey } from './helpers.es6';

export function getUserState({ state, key }) {
  return get(state, ['statePersistence', 'user', key], {});
}

export function getUserEnvState({ state, key, spaceId, envId }) {
  return get(state, ['statePersistence', 'userEnv', makeEnvKey({ spaceId, envId }), key], {});
}

export function getEnvState({ state, key, spaceId, envId }) {
  return get(state, ['statePersistence', 'env', makeEnvKey({ spaceId, envId }), key], {});
}
