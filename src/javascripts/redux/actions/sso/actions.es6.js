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
    payload: identityProvider
  };
}

export const SSO_CREATE_IDENTITY_PROVIDER_FAILURE = 'SSO_CREATE_IDENTITY_PROVIDER/FAILURE';
export function ssoCreateIdentityProviderFailure(error) {
  return {
    type: SSO_CREATE_IDENTITY_PROVIDER_FAILURE,
    error: true,
    payload: error
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
    payload: identityProvider
  };
}

export const SSO_GET_IDENTITY_PROVIDER_FAILURE = 'SSO_GET_IDENTITY_PROVIDER/FAILURE';
export function ssoGetIdentityProviderFailure(error) {
  return {
    type: SSO_GET_IDENTITY_PROVIDER_FAILURE,
    error: true,
    payload: error
  };
}

export const SSO_UPDATE_IDENTITY_PROVIDER = 'SSO_UPDATE_IDENTITY_PROVIDER';
export function ssoUpdateIdentityProvider(identityProvider) {
  return {
    type: SSO_UPDATE_IDENTITY_PROVIDER,
    payload: identityProvider
  };
}

export const SSO_FIELD_UPDATE_VALUE = 'SSO_FIELD_UPDATE/VALUE';
export function ssoFieldUpdateValue(fieldName, value) {
  return {
    type: SSO_FIELD_UPDATE_VALUE,
    payload: value,
    meta: { fieldName }
  };
}

export const SSO_FIELD_UPDATE_PENDING = 'SSO_FIELD_UPDATE/PENDING';
export function ssoFieldUpdatePending(fieldName) {
  return {
    type: SSO_FIELD_UPDATE_PENDING,
    meta: { fieldName }
  };
}

export const SSO_FIELD_UPDATE_SUCCESS = 'SSO_FIELD_UPDATE/SUCCESS';
export function ssoFieldUpdateSuccess(fieldName) {
  return {
    type: SSO_FIELD_UPDATE_SUCCESS,
    meta: { fieldName }
  };
}

export const SSO_FIELD_UPDATE_FAILURE = 'SSO_FIELD_UPDATE/FAILURE';
export function ssoFieldUpdateFailure(fieldName, error) {
  return {
    type: SSO_FIELD_UPDATE_FAILURE,
    error: true,
    payload: error,
    meta: { fieldName }
  };
}
export const SSO_FIELD_VALIDATION_SUCCESS = 'SSO_FIELD_VALIDATION/SUCCESS';
export function ssoFieldValidationSuccess(fieldName) {
  return {
    type: SSO_FIELD_VALIDATION_SUCCESS,
    meta: { fieldName }
  };
}

export const SSO_FIELD_VALIDATION_FAILURE = 'SSO_FIELD_VALIDATION/FAILURE';
export function ssoFieldValidationFailure(fieldName, error) {
  return {
    type: SSO_FIELD_VALIDATION_FAILURE,
    error: true,
    payload: error,
    meta: { fieldName }
  };
}

export const SSO_CONNECTION_TEST_START = 'SSO_CONNECTION_TEST/START';
export function ssoConnectionTestStart() {
  return {
    type: SSO_CONNECTION_TEST_START
  };
}

export const SSO_CONNECTION_TEST_END = 'SSO_CONNECTION_TEST/END';
export function ssoConnectionTestEnd() {
  return {
    type: SSO_CONNECTION_TEST_END
  };
}

export const SSO_CONNECTION_TEST_RESULT = 'SSO_CONNECTION_TEST/RESULT';
export function ssoConnectionTestResult(data) {
  return {
    type: SSO_CONNECTION_TEST_RESULT,
    payload: data
  };
}

export const SSO_ENABLE_PENDING = 'SSO_ENABLE/PENDING';
export function ssoEnablePending() {
  return {
    type: SSO_ENABLE_PENDING
  };
}

export const SSO_ENABLE_SUCCESS = 'SSO_ENABLE/SUCCESS';
export function ssoEnableSuccess(identityProvider) {
  return {
    type: SSO_ENABLE_SUCCESS,
    payload: identityProvider
  };
}

export const SSO_ENABLE_FAILURE = 'SSO_ENABLE/FAILURE';
export function ssoEnableFailure(error) {
  return {
    type: SSO_ENABLE_FAILURE,
    error: true,
    payload: error
  };
}
