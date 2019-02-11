import * as validators from './validators.es6';

export function validate(fieldName, value) {
  if (!validators[fieldName]) {
    return true;
  }

  return Boolean(validators[fieldName](value));
}

export function connectionTestResultFromIdp(idp) {
  const result = {
    testConnectionResult: null,
    testConnectionError: null,
    testConnectionAt: null,
    version: null
  };

  if (idp.testConnectionResult) {
    result.testConnectionResult = idp.testConnectionResult;
  }

  if (idp.testConnectionAt) {
    result.testConnectionAt = idp.testConnectionAt;
  }

  if (idp.testConnectionErrors) {
    result.testConnectionError = idp.testConnectionErrors;
  }

  result.version = idp.sys.version;

  return result;
}
