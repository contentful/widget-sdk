import { createUsersEndpoint } from 'data/EndpointFactory.es6';

const alphaHeaders = {
  'x-contentful-enable-alpha-feature': 'state-persistence'
};

const usersEndpoint = createUsersEndpoint();

export async function fetchUserState(key) {
  return usersEndpoint(
    {
      method: 'GET',
      path: ['states', key]
    },
    alphaHeaders
  );
}

export async function updateUserState(key, { version, ...data }) {
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
