import { MFA_API, getAlphaHeader } from 'alphaHeaders.js';
import { createUsersEndpoint } from 'data/EndpointFactory';
import type { UserData, AccountDeletionReasons } from '../types';

const totpAlphaHeader = getAlphaHeader(MFA_API);
const usersEndpoint = createUsersEndpoint();

export async function fetchUserData(): Promise<UserData> {
  return await usersEndpoint({
    method: 'GET',
    query: { profile: '' },
  });
}

export async function updateUserData({ version, data }): Promise<UserData> {
  return await usersEndpoint({
    method: 'PUT',
    data,
    version,
  });
}

export async function getUserTotp() {
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
  return usersEndpoint(
    {
      method: 'DELETE',
      path: ['mfa', 'totp'],
    },
    { ...totpAlphaHeader }
  );
}

export async function enableTotp(code: string) {
  return usersEndpoint(
    {
      method: 'PUT',
      path: ['mfa', 'totp', 'verify'],
      data: { totpCode: code },
    },
    { ...totpAlphaHeader }
  );
}

export async function deleteUserIdentityData(id: string) {
  return await usersEndpoint({
    method: 'DELETE',
    path: ['identities', id],
  });
}

export async function deleteUserAccount(data: {
  password: string;
  reason: keyof typeof AccountDeletionReasons;
  description?: string;
}) {
  return await usersEndpoint({
    method: 'POST',
    path: ['user_cancellations'],
    data,
  });
}
