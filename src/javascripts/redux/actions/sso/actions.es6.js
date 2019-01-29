export const SSO_CREATE_IDENTITY_PROVIDER_PENDING = 'SSO_CREATE_IDENTITY_PROVIDER/PENDING';
export function ssoCreateIdentityProviderPending(isPending) {
  return {
    type: SSO_CREATE_IDENTITY_PROVIDER_PENDING,
    isPending
  };
}

export const SSO_CREATE_IDENTITY_PROVIDER_SUCCESS = 'SSO_CREATE_IDENTITY_PROVIDER/SUCCESS';
export function ssoCreateIdentityProviderSuccess(identityProvider) {
  return {
    type: SSO_CREATE_IDENTITY_PROVIDER_SUCCESS,
    identityProvider
  };
}

export const SSO_CREATE_IDENTITY_PROVIDER_FAILURE = 'SSO_CREATE_IDENTITY_PROVIDER/FAILURE';
export function ssoCreateIdentityProviderFailure(error) {
  return {
    type: SSO_CREATE_IDENTITY_PROVIDER_FAILURE,
    error
  };
}

export const SSO_GET_IDENTITY_PROVIDER_PENDING = 'SSO_GET_IDENTITY_PROVIDER/PENDING';
export function ssoGetIdentityProviderPending(isPending) {
  return {
    type: SSO_GET_IDENTITY_PROVIDER_PENDING,
    isPending
  };
}

export const SSO_GET_IDENTITY_PROVIDER_SUCCESS = 'SSO_GET_IDENTITY_PROVIDER/SUCCESS';
export function ssoGetIdentityProviderSuccess(identityProvider) {
  return {
    type: SSO_GET_IDENTITY_PROVIDER_SUCCESS,
    identityProvider
  };
}

export const SSO_GET_IDENTITY_PROVIDER_FAILURE = 'SSO_GET_IDENTITY_PROVIDER/FAILURE';
export function ssoGetIdentityProviderFailure(error) {
  return {
    type: SSO_GET_IDENTITY_PROVIDER_FAILURE,
    error
  };
}

export const SSO_FIELD_UPDATE_VALUE = 'SSO_FIELD_UPDATE/VALUE';
export function ssoFieldUpdateValue(fieldName, value) {
  return {
    type: SSO_FIELD_UPDATE_VALUE,
    fieldName,
    value
  };
}

export const SSO_FIELD_UPDATE_PENDING = 'SSO_FIELD_UPDATE/PENDING';
export function ssoFieldUpdatePending(fieldName, isPending) {
  return {
    type: SSO_FIELD_UPDATE_PENDING,
    fieldName,
    isPending
  };
}

export const SSO_FIELD_UPDATE_SUCCESS = 'SSO_FIELD_UPDATE/SUCCESS';
export function ssoFieldUpdateSuccess(fieldName) {
  return {
    type: SSO_FIELD_UPDATE_SUCCESS,
    fieldName
  };
}

export const SSO_FIELD_UPDATE_FAILURE = 'SSO_FIELD_UPDATE/FAILURE';
export function ssoFieldUpdateFailure(fieldName, error) {
  return {
    type: SSO_FIELD_UPDATE_FAILURE,
    fieldName,
    error
  };
}
