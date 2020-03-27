import { createUsersEndpoint } from 'data/EndpointFactory';
import { MFA_API, getAlphaHeader } from 'alphaHeaders.js';
const totpAlphaHeader = getAlphaHeader(MFA_API);

export async function fetchUserData() {
  const usersEndpoint = createUsersEndpoint();
  return await usersEndpoint({
    method: 'GET',
    query: { profile: '' },
  });
}

export async function updateUserData({ version, data }) {
  const usersEndpoint = createUsersEndpoint();
  return await usersEndpoint({
    method: 'PUT',
    data,
    version,
  });
}

export async function getUserTotp() {
  const usersEndpoint = createUsersEndpoint();

  return usersEndpoint(
    {
      method: 'POST',
      path: ['mfa', 'totp'],
      data: {},
    },
    { ...totpAlphaHeader }
  );
}

export async function deleteUserTotp() {
  const usersEndpoint = createUsersEndpoint();

  return usersEndpoint(
    {
      method: 'DELETE',
      path: ['mfa', 'totp'],
    },
    { ...totpAlphaHeader }
  );
}

export async function enableTotp(code) {
  const usersEndpoint = createUsersEndpoint();

  return usersEndpoint(
    {
      method: 'PUT',
      path: ['mfa', 'totp', 'verify'],
      data: { totpCode: code },
    },
    { ...totpAlphaHeader }
  );
}

export async function deleteUserIdentityData(id) {
  const usersEndpoint = createUsersEndpoint();
  return await usersEndpoint({
    method: 'DELETE',
    path: ['identities', id],
  });
}

export async function deleteUserAccount(data) {
  const usersEndpoint = createUsersEndpoint();
  return await usersEndpoint({
    method: 'POST',
    path: ['user_cancellations'],
    data,
  });
}
