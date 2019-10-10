import { createUsersEndpoint } from 'data/EndpointFactory.es6';

export async function fetchUserData() {
  const usersEndpoint = createUsersEndpoint();
  return await usersEndpoint({
    method: 'GET',
    query: { profile: '' }
  });
}

export async function updateUserData({ version, data }) {
  const usersEndpoint = createUsersEndpoint();
  return await usersEndpoint({
    method: 'PUT',
    data,
    version
  });
}

export async function deleteUserIdentityData(id) {
  const usersEndpoint = createUsersEndpoint();
  return await usersEndpoint({
    method: 'DELETE',
    path: ['identities', id]
  });
}

export async function deleteUserAccount(data) {
  const usersEndpoint = createUsersEndpoint();
  return await usersEndpoint({
    method: 'POST',
    path: ['user_cancellations'],
    data
  });
}
