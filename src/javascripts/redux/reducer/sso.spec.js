import * as reducers from './sso.es6';
import * as actions from 'redux/actions/sso/actions.es6';

const callReducer = (reducer, action) => {
  return reducer(undefined, action);
};

describe('SSO Redux reducers', () => {
  describe('identityProvider', () => {
    it('should handle SSO identityProvider creation pending state', () => {
      expect(
        callReducer(reducers.identityProvider, {
          type: actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING
        })
      ).toEqual({
        isPending: true
      });
    });

    it('should handle SSO identity provider retrieval pending state', () => {
      expect(
        callReducer(reducers.identityProvider, {
          type: actions.SSO_GET_IDENTITY_PROVIDER_PENDING
        })
      ).toEqual({
        isPending: true
      });
    });

    it('should handle SSO identity provider creation success state', () => {
      const identityProvider = {
        ssoName: 'something-1234'
      };

      expect(
        callReducer(reducers.identityProvider, {
          type: actions.SSO_CREATE_IDENTITY_PROVIDER_SUCCESS,
          payload: identityProvider
        })
      ).toEqual({
        data: identityProvider,
        isPending: false
      });
    });

    it('should handle SSO identity provider retrieval success state', () => {
      const identityProvider = {
        ssoName: 'something-1234'
      };

      expect(
        callReducer(reducers.identityProvider, {
          type: actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS,
          payload: identityProvider
        })
      ).toEqual({
        data: identityProvider,
        isPending: false
      });
    });

    it('should handle SSO identity provider update success state', () => {
      const identityProvider = {
        ssoName: 'something-1234'
      };

      expect(
        callReducer(reducers.identityProvider, {
          type: actions.SSO_UPDATE_IDENTITY_PROVIDER,
          payload: identityProvider
        })
      ).toEqual({
        data: identityProvider,
        isPending: false
      });
    });

    it('should handle SSO identity provider creation failure state', () => {
      const error = new Error('Something bad happened');

      expect(
        callReducer(reducers.identityProvider, {
          type: actions.SSO_CREATE_IDENTITY_PROVIDER_FAILURE,
          error: true,
          payload: error
        })
      ).toEqual({
        error: error.message,
        isPending: false
      });
    });

    it('should handle SSO identity provider retrieval failure state', () => {
      const error = new Error('Something bad happened');

      expect(
        callReducer(reducers.identityProvider, {
          type: actions.SSO_GET_IDENTITY_PROVIDER_FAILURE,
          error: true,
          payload: error
        })
      ).toEqual({
        error: error.message,
        isPending: false
      });
    });

    it('should handle SSO enabling pending state', () => {
      expect(
        callReducer(reducers.identityProvider, {
          type: actions.SSO_ENABLE_PENDING
        })
      ).toEqual({
        isEnabling: true
      });
    });

    it('should handle SSO enabling success state', () => {
      const identityProvider = {};

      expect(
        callReducer(reducers.identityProvider, {
          type: actions.SSO_ENABLE_SUCCESS,
          payload: identityProvider
        })
      ).toEqual({
        data: identityProvider,
        isEnabling: false
      });
    });

    it('should handle SSO enabling failure state', () => {
      const error = new Error('Could not enable');

      expect(
        callReducer(reducers.identityProvider, {
          type: actions.SSO_ENABLE_FAILURE,
          error: true,
          payload: error
        })
      ).toEqual({
        error: error.message,
        isEnabling: false
      });
    });

    it('should update the version when the SSO connection test result action is fired', () => {
      const version = 7;

      expect(
        callReducer(reducers.identityProvider, {
          type: actions.SSO_CONNECTION_TEST_RESULT,
          payload: {
            version
          }
        })
      ).toEqual({
        data: {
          sys: {
            version
          }
        }
      });
    });
  });

  describe('fields', () => {
    it('should handle get and create identity provider success states', () => {
      const identityProvider = {
        ssoName: 'something-1234',
        idpName: 'Auth0',
        idpSsoTargetUrl: 'https://example.com/auth'
      };

      expect(
        callReducer(reducers.fields, {
          type: actions.SSO_CREATE_IDENTITY_PROVIDER_SUCCESS,
          payload: identityProvider
        })
      ).toEqual({
        ssoName: {
          value: 'something-1234'
        },
        idpName: {
          value: 'Auth0'
        },
        idpSsoTargetUrl: {
          value: 'https://example.com/auth'
        },
        idpCert: {
          value: undefined
        }
      });

      expect(
        callReducer(reducers.fields, {
          type: actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS,
          payload: identityProvider
        })
      ).toEqual({
        ssoName: {
          value: 'something-1234'
        },
        idpName: {
          value: 'Auth0'
        },
        idpSsoTargetUrl: {
          value: 'https://example.com/auth'
        },
        idpCert: {
          value: undefined
        }
      });
    });

    it('should handle field update value state', () => {
      expect(
        callReducer(reducers.fields, {
          type: actions.SSO_FIELD_UPDATE_VALUE,
          payload: 'something-else',
          meta: {
            fieldName: 'ssoName'
          }
        })
      ).toEqual({
        ssoName: {
          value: 'something-else'
        }
      });
    });

    it('should handle field update pending state', () => {
      expect(
        callReducer(reducers.fields, {
          type: actions.SSO_FIELD_UPDATE_PENDING,
          meta: {
            fieldName: 'ssoName'
          }
        })
      ).toEqual({
        ssoName: {
          isPending: true
        }
      });
    });

    it('should handle field validation success state', () => {
      expect(
        callReducer(reducers.fields, {
          type: actions.SSO_FIELD_VALIDATION_SUCCESS,
          meta: {
            fieldName: 'ssoName'
          }
        })
      ).toEqual({
        ssoName: {
          error: null,
          isPending: false
        }
      });
    });

    it('should handle field update and validation failure states', () => {
      const error = new Error('Bad field');

      expect(
        callReducer(reducers.fields, {
          type: actions.SSO_FIELD_VALIDATION_FAILURE,
          error: true,
          payload: error,
          meta: {
            fieldName: 'ssoName'
          }
        })
      ).toEqual({
        ssoName: {
          error: error.message,
          isPending: false
        }
      });

      expect(
        callReducer(reducers.fields, {
          type: actions.SSO_FIELD_UPDATE_FAILURE,
          error: true,
          payload: error,
          meta: {
            fieldName: 'ssoName'
          }
        })
      ).toEqual({
        ssoName: {
          error: error.message,
          isPending: false
        }
      });
    });
  });

  describe('connectionTest', () => {
    it('should handle SSO connection test start state', () => {
      expect(
        callReducer(reducers.connectionTest, {
          type: actions.SSO_CONNECTION_TEST_START
        })
      ).toEqual({
        isPending: true
      });
    });

    it('should handle SSO connection test end state', () => {
      expect(
        callReducer(reducers.connectionTest, {
          type: actions.SSO_CONNECTION_TEST_END
        })
      ).toEqual({
        isPending: false
      });
    });

    it('should handle SSO connection test result state', () => {
      const testResult = {
        testConnectionResult: 'failure',
        testConnectionError: ['Invalid SAML certificate signature'],
        testConnectionAt: 'timestamp'
      };

      expect(
        callReducer(reducers.connectionTest, {
          type: actions.SSO_CONNECTION_TEST_RESULT,
          payload: testResult
        })
      ).toEqual({
        result: 'failure',
        errors: testResult.testConnectionError,
        timestamp: 'timestamp',
        isPending: false
      });
    });
  });
});
