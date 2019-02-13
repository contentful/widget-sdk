import _ from 'lodash';
import * as validators from './validators.es6';
import { TEST_RESULTS } from './constants.es6';

export function validate(fieldName, value) {
  if (!validators[fieldName]) {
    return true;
  }

  return Boolean(validators[fieldName](value));
}

export function connectionTestResultFromIdp(idp) {
  return {
    testConnectionResult: _.get(idp, 'testConnectionResult', null),
    testConnectionError: _.get(idp, 'testConnectionErrors', null),
    testConnectionAt: _.get(idp, 'testConnectionAt', null),
    version: _.get(idp, ['sys', 'version'], null)
  };
}

export function connectionTestingAllowed(fields, connectionTest) {
  // Do not allow testing the connection if any of the conditions are true:
  //
  // 1. the idpCert field has no value
  // 2. the idpCert field has an error
  // 3. the idpSsoTargetUrl field has no value
  // 4. the idpSsoTargetUrl field has an error
  // 5. the connection test is pending
  // 6. the connection test result is successful
  return !(
    !fields.idpCert.value ||
    fields.idpCert.error ||
    !fields.idpSsoTargetUrl.value ||
    fields.idpSsoTargetUrl.error ||
    connectionTest.isPending ||
    connectionTest.result === TEST_RESULTS.success
  );
}
