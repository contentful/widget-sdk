import * as utils from './utils.es6';

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
});
