import { createUsersEndpoint } from 'data/EndpointFactory.es6';
import PropTypes from 'prop-types';

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

export const userAccountDataShape = PropTypes.shape({
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  avatarUrl: PropTypes.string,
  email: PropTypes.string,
  identities: PropTypes.array,
  sys: PropTypes.shape({ version: PropTypes.number })
});
