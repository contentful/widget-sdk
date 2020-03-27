import { createUsersEndpoint } from 'data/EndpointFactory';
import { STATE_PERSISTENCE, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(STATE_PERSISTENCE);

export async function fetchUserState(key) {
  const usersEndpoint = createUsersEndpoint();
  return usersEndpoint(
    {
      method: 'GET',
      path: ['states', key],
    },
    alphaHeader
  );
}

export async function updateUserState(key, { version, ...data }) {
  const usersEndpoint = createUsersEndpoint();
  return usersEndpoint(
    {
      method: 'PUT',
      path: ['states', key],
      data,
      version,
    },
    alphaHeader
  );
}
