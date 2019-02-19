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

  describe('#connectionTestResultFromIdp', () => {
    const baseResult = {
      testConnectionResult: null,
      testConnectionError: null,
      testConnectionAt: null,
      version: null
    };

    it('should map the connection test result', () => {
      const idp = {
        testConnectionResult: 'yay!'
      };

      expect(utils.connectionTestResultFromIdp(idp)).toEqual(
        Object.assign({}, baseResult, {
          testConnectionResult: 'yay!'
        })
      );
    });

    it('should map the connection test timestamp', () => {
      const idp = {
        testConnectionAt: 'some timestamp'
      };

      expect(utils.connectionTestResultFromIdp(idp)).toEqual(
        Object.assign({}, baseResult, {
          testConnectionAt: 'some timestamp'
        })
      );
    });

    it('should map the connection test errors', () => {
      const idp = {
        testConnectionErrors: ['some error', 'another error']
      };

      expect(utils.connectionTestResultFromIdp(idp)).toEqual(
        Object.assign({}, baseResult, {
          testConnectionError: ['some error', 'another error']
        })
      );
    });

    it('should map the connection test model version', () => {
      const idp = {
        sys: {
          version: '12'
        }
      };

      expect(utils.connectionTestResultFromIdp(idp)).toEqual(
        Object.assign({}, baseResult, {
          version: '12'
        })
      );
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
});
