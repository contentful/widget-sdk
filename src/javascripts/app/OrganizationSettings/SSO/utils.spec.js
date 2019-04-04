import * as utils from './utils.es6';

import { track } from 'analytics/Analytics.es6';

jest.mock('./validators.es6', () => ({
  myAwesomeField: str => {
    if (str === 'secret') {
      return `${str} is valid!`;
    } else {
      return null;
    }
  }
}));

describe('SSO utils', () => {
  describe('#validate', () => {
    it('should return true if no validator exists for given fieldName', () => {
      expect(utils.validate('aDifferentField', 'some value')).toBe(true);
    });

    it('should the boolean value that the validator returns if it exists for fieldName', () => {
      expect(utils.validate('myAwesomeField', 'secret')).toBe(true);
      expect(utils.validate('myAwesomeField', 'not secret')).toBe(false);
    });
  });

  describe('#connectionTestingAllowed', () => {
    let fields;
    let connectionTest;

    beforeEach(() => {
      fields = {
        idpCert: {
          value: 'cert',
          error: null
        },
        idpSsoTargetUrl: {
          value: 'url',
          error: null
        }
      };

      connectionTest = {
        isPending: false
      };
    });

    it('should not allow testing if idpCert field has no value', () => {
      fields.idpCert.value = null;

      expect(utils.connectionTestingAllowed(fields, connectionTest)).toBe(false);
    });

    it('should not allow testing if idpCert field has an error', () => {
      fields.idpCert.error = 'Bad certificate';

      expect(utils.connectionTestingAllowed(fields, connectionTest)).toBe(false);
    });

    it('should not allow testing if idpSsoTargetUrl field has no value', () => {
      fields.idpSsoTargetUrl.value = null;
      expect(utils.connectionTestingAllowed(fields, connectionTest)).toBe(false);
    });

    it('should not allow testing if idpSsoTargetUrl field has an error', () => {
      fields.idpSsoTargetUrl.error = 'Bad target url';

      expect(utils.connectionTestingAllowed(fields, connectionTest)).toBe(false);
    });

    it('should not allow testing if the connection is currently being tested', () => {
      connectionTest.isPending = true;

      expect(utils.connectionTestingAllowed(fields, connectionTest)).toBe(false);
    });

    it('should be allowed if all cases pass', () => {
      expect(utils.connectionTestingAllowed(fields, connectionTest)).toBe(true);
    });
  });

  describe('#fieldErrorMessage', () => {
    const defaultErrorMessage = 'Field is not valid';

    it('should have custom errors for ssoName, idpCert, and idpSsoTargetUrl', () => {
      expect(utils.fieldErrorMessage('ssoName')).toBeInstanceOf(Error);
      expect(utils.fieldErrorMessage('ssoName').message).not.toBe(defaultErrorMessage);

      expect(utils.fieldErrorMessage('idpCert')).toBeInstanceOf(Error);
      expect(utils.fieldErrorMessage('idpCert').message).not.toBe(defaultErrorMessage);

      expect(utils.fieldErrorMessage('idpSsoTargetUrl')).toBeInstanceOf(Error);
      expect(utils.fieldErrorMessage('idpSsoTargetUrl').message).not.toBe(defaultErrorMessage);
    });

    it('should have return the default error otherwise', () => {
      expect(utils.fieldErrorMessage('otherField')).toBeInstanceOf(Error);
      expect(utils.fieldErrorMessage('otherField').message).toBe(defaultErrorMessage);
    });
  });

  describe('#formatConnectionTestErrors', () => {
    const certErrMsg = 'Invalid Signature on SAML Response';
    const relayStateErrMsg = 'Missing RelayState, maybe incorrect SSO target URL';
    const givenNameErrMsg = `'givenname' needs to be included as a SAML response attribute, or a custom mapping needs to be defined on the identity provider`;
    const surnameErrMsg = `'surname' needs to be included as a SAML response attribute, or a custom mapping needs to be defined on the identity provider`;
    const otherErrMsg = 'Something else bad happened dude';

    const certFormattedErrMsg = 'The X.509 certificate is incorrect';
    const relayStateFormattedErrMsg =
      'Contentful could not determine that the connection is in test mode, check the Redirect URL';

    it('should return null if not given an array', () => {
      expect(utils.formatConnectionTestErrors('string')).toBeNull();
    });

    it('should return an empty array if no errors are given', () => {
      expect(utils.formatConnectionTestErrors([])).toEqual([]);
    });

    it('should handle an invalid certificate error', () => {
      expect(utils.formatConnectionTestErrors([certErrMsg])).toEqual([certFormattedErrMsg]);
    });

    it('should handle an invalid relay state error', () => {
      expect(utils.formatConnectionTestErrors([relayStateErrMsg])).toEqual([
        relayStateFormattedErrMsg
      ]);
    });

    it('should handle one or more missing attributes', () => {
      expect(utils.formatConnectionTestErrors([givenNameErrMsg])).toEqual([
        'The givenname attribute is missing'
      ]);

      expect(utils.formatConnectionTestErrors([surnameErrMsg])).toEqual([
        'The surname attribute is missing'
      ]);

      expect(utils.formatConnectionTestErrors([givenNameErrMsg, surnameErrMsg])).toEqual([
        'The givenname and surname attributes are missing'
      ]);
    });

    it('should pass other errors through as-is', () => {
      expect(utils.formatConnectionTestErrors([otherErrMsg])).toEqual([otherErrMsg]);
    });

    it('should handle a combination of the error messages', () => {
      expect(
        utils.formatConnectionTestErrors([
          certErrMsg,
          relayStateErrMsg,
          givenNameErrMsg,
          surnameErrMsg,
          otherErrMsg
        ])
      ).toEqual([
        certFormattedErrMsg,
        relayStateFormattedErrMsg,
        'The givenname and surname attributes are missing',
        otherErrMsg
      ]);
    });
  });

  describe('#trackTestResult', () => {
    beforeEach(() => {
      track.mockClear();
    });

    it('should fire the sso:connection_test_result event', () => {
      utils.trackTestResult();

      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenNthCalledWith(1, 'sso:connection_test_result', expect.any(Object));
    });

    it('should track an unknown result with no errors if called without arguments', () => {
      utils.trackTestResult();

      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenNthCalledWith(1, 'sso:connection_test_result', {
        result: 'unknown',
        errors: null
      });
    });

    it('should track result', () => {
      utils.trackTestResult({ result: 'success' });

      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenNthCalledWith(1, 'sso:connection_test_result', {
        result: 'success',
        errors: null
      });
    });

    it('should track errors', () => {
      utils.trackTestResult({ errors: ['Something bad happened'] });

      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenNthCalledWith(1, 'sso:connection_test_result', {
        result: 'unknown',
        errors: ['Something bad happened']
      });
    });
  });
});
