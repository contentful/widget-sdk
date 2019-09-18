import { createUsersEndpoint } from 'data/EndpointFactory.es6';

const alphaHeaders = {
  'x-contentful-enable-alpha-feature': 'state-persistence'
};

export async function fetchUserState(key) {
  const usersEndpoint = createUsersEndpoint();
  return usersEndpoint(
    {
      method: 'GET',
      path: ['states', key]
    },
    alphaHeaders
  );
}

export async function updateUserState(key, { version, ...data }) {
  const usersEndpoint = createUsersEndpoint();
  return usersEndpoint(
    {
      method: 'PUT',
      path: ['states', key],
      data,
      version
    },
    alphaHeaders
  );
}
