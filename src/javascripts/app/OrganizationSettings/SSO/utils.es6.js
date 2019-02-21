import _ from 'lodash';
import * as validators from './validators.es6';
import * as fieldErrorMessageGenerators from './fieldErrorMessages.es6';

export function validate(fieldName, value) {
  if (!validators[fieldName]) {
    return true;
  }

  return Boolean(validators[fieldName](value));
}

export function connectionTestingAllowed(fields, connectionTest) {
  // Do not allow testing the connection if any of the conditions are true:
  //
  // 1. the idpCert field has no value
  // 2. the idpCert field has an error
  // 3. the idpSsoTargetUrl field has no value
  // 4. the idpSsoTargetUrl field has an error
  // 5. the connection test is pending
  return !(
    !fields.idpCert.value ||
    fields.idpCert.error ||
    !fields.idpSsoTargetUrl.value ||
    fields.idpSsoTargetUrl.error ||
    connectionTest.isPending
  );
}

export function fieldErrorMessage(fieldName, { api } = {}) {
  if (!fieldErrorMessageGenerators[fieldName]) {
    return new Error('Field is not valid');
  }

  return fieldErrorMessageGenerators[fieldName]({ api });
}
