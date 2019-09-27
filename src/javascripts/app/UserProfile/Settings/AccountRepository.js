import { createUsersEndpoint } from 'data/EndpointFactory.es6';

const usersEndpoint = createUsersEndpoint();

export async function fetchUserData() {
  return await usersEndpoint({
    method: 'GET',
    query: { profile: '' }
  });
}

export async function updateUserData({ version, data }) {
  return await usersEndpoint({
    method: 'PUT',
    data,
    version
  });
}

export async function deleteUserIdentityData(id) {
  return await usersEndpoint({
    method: 'DELETE',
    path: ['identities', id]
  });
}

export async function deleteUserAccount(data) {
  return await usersEndpoint({
    method: 'POST',
    path: ['user_cancellations'],
    data
  });
}
