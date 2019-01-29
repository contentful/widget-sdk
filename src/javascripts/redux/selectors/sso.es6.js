import { get } from 'lodash';

export function getField(state, fieldName) {
  const fields = getSsoFields(state);

  if (!fields) {
    return null;
  }

  return get(fields, fieldName, {
    name: fieldName,
    value: null
  });
}

export function getIdentityProvider(state) {
  return get(state, 'identityProvider', null);
}

export function getSsoFields(state) {
  return get(state, 'fields', {});
}
