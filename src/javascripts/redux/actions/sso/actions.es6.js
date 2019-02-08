export const SSO_CREATE_IDENTITY_PROVIDER_PENDING = 'SSO_CREATE_IDENTITY_PROVIDER/PENDING';
export function ssoCreateIdentityProviderPending() {
  return {
    type: SSO_CREATE_IDENTITY_PROVIDER_PENDING
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
export function ssoGetIdentityProviderPending() {
  return {
    type: SSO_GET_IDENTITY_PROVIDER_PENDING
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

export const SSO_UPDATE_IDENTITY_PROVIDER = 'SSO_UPDATE_IDENTITY_PROVIDER';
export function ssoUpdateIdentityProvider(identityProvider) {
  return {
    type: SSO_UPDATE_IDENTITY_PROVIDER,
    identityProvider
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
export function ssoFieldUpdatePending(fieldName) {
  return {
    type: SSO_FIELD_UPDATE_PENDING,
    fieldName
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
export const SSO_FIELD_VALIDATION_SUCCESS = 'SSO_FIELD_VALIDATION/SUCCESS';
export function ssoFieldValidationSuccess(fieldName) {
  return {
    type: SSO_FIELD_VALIDATION_SUCCESS,
    fieldName
  };
}

export const SSO_FIELD_VALIDATION_FAILURE = 'SSO_FIELD_VALIDATION/FAILURE';
export function ssoFieldValidationFailure(fieldName, error) {
  return {
    type: SSO_FIELD_VALIDATION_FAILURE,
    fieldName,
    error
  };
}
