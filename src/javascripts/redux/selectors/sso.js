import { get } from 'lodash';

export function getField(state, fieldName) {
  const fields = getFields(state);

  if (!fields) {
    return null;
  }

  return get(fields, fieldName, {
    name: fieldName,
    value: null,
  });
}

export function getIdentityProvider(state) {
  return get(state, ['sso', 'identityProvider'], null);
}

export function getIdentityProviderValue(state, fieldName) {
  return get(getIdentityProvider(state), ['data', fieldName], null);
}

export function getFields(state) {
  return get(state, ['sso', 'fields'], {});
}

export function getIdentityProviderVersion(state) {
  return get(getIdentityProvider(state), ['data', 'sys', 'version'], null);
}

export function getConnectionTest(state) {
  return get(state, ['sso', 'connectionTest'], {});
}

export function getConnectionTestWindow(state) {
  return get(getConnectionTest(state), ['testWindow'], null);
}

export function getConnectionTestIntervalTimer(state) {
  return get(getConnectionTest(state), ['timer'], null);
}