import * as validators from './validators.es6';
import * as fieldErrorMessageGenerators from './fieldErrorMessages.es6';
import { joinWithAnd } from 'utils/StringUtils.es6';
import { track } from 'analytics/Analytics.es6';

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

/*
  Takes the original technical errors from GK and makes them more
  user friendly.

  Handles the following cases:
  Bad certificate
  Bad RelayState
  Missing attributes

  If the above errors occur, then we show a specific different message for
  that error. If other errors occur, they are shown as is without transformation.
 */
export function formatConnectionTestErrors(errors) {
  if (!Array.isArray(errors)) {
    return null;
  }

  const badCertRegex = /^Invalid Signature/;
  const badRelayStateRegex = /incorrect SSO target URL/;
  const missingAttrRegex = /^'([A-Za-z]+)' needs to be included as a SAML response attribute/;

  const missingAttrs = [];
  const other = [];
  const formatted = [];

  errors.forEach(error => {
    const missingAttrMatch = missingAttrRegex.exec(error);

    if (badCertRegex.exec(error)) {
      formatted.push('The X.509 certificate is incorrect');
    } else if (badRelayStateRegex.exec(error)) {
      formatted.push(
        'Contentful could not determine that the connection is in test mode, check the Redirect URL'
      );
    } else if (missingAttrMatch) {
      missingAttrs.push(missingAttrMatch[1]);
    } else {
      other.push(error);
    }
  });

  if (missingAttrs.length) {
    const quantifier = missingAttrs.length > 1 ? 'attributes are' : 'attribute is';

    formatted.push(`The ${joinWithAnd(missingAttrs)} ${quantifier} missing`);
  }

  if (other.length) {
    other.forEach(e => formatted.push(e));
  }

  return formatted;
}

export function trackTestResult(testData = {}) {
  const result = testData.result;
  const errors = formatConnectionTestErrors(testData.errors);

  track('sso:connection_test_result', {
    result: result ? result : 'unknown',
    errors
  });
}
