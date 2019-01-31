import * as reducers from './sso.es6';
import * as actions from 'redux/actions/sso/actions.es6';

const callReducer = (reducer, action) => {
  return reducer(undefined, action);
}

describe('SSO Redux reducers', () => {
  describe('identityProvider', () => {
    it('should handle SSO identityProvider creation pending state', () => {
      expect(callReducer(reducers.identityProvider, {
        type: actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING,
        isPending: true
      })).toEqual({
        isPending: true
      });

      expect(callReducer(reducers.identityProvider, {
        type: actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING,
        isPending: false
      })).toEqual({
        isPending: false
      });
    });

    it('should handle SSO identity provider creation success state', () => {
      const identityProvider = {
        ssoName: 'something-1234'
      };

      expect(callReducer(reducers.identityProvider, {
        type: actions.SSO_CREATE_IDENTITY_PROVIDER_SUCCESS,
        identityProvider
      })).toEqual({
        data: identityProvider
      });
    });

    it('should handle SSO identity provider creation failure state', () => {
      const error = new Error('Something bad happened');

      expect(callReducer(reducers.identityProvider, {
        type: actions.SSO_CREATE_IDENTITY_PROVIDER_FAILURE,
        error
      })).toEqual({
        error
      });
    });

    it('should handle SSO identity provider retrieval pending state', () => {
      expect(callReducer(reducers.identityProvider, {
        type: actions.SSO_GET_IDENTITY_PROVIDER_PENDING,
        isPending: true
      })).toEqual({
        isPending: true
      });
    });

    it('should handle SSO identity provider retrieval success state', () => {
      const identityProvider = {
        ssoName: 'something-1234'
      };

      expect(callReducer(reducers.identityProvider, {
        type: actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS,
        identityProvider
      })).toEqual({
        data: identityProvider
      });
    });

    it('should handle SSO identity provider retrieval failure state', () => {
      const error = new Error('Something bad happened');

      expect(callReducer(reducers.identityProvider, {
        type: actions.SSO_GET_IDENTITY_PROVIDER_FAILURE,
        error
      })).toEqual({
        error
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

      expect(callReducer(reducers.fields, {
        type: actions.SSO_CREATE_IDENTITY_PROVIDER_SUCCESS,
        identityProvider
      })).toEqual({
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

      expect(callReducer(reducers.fields, {
        type: actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS,
        identityProvider
      })).toEqual({
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
      expect(callReducer(reducers.fields, {
        type: actions.SSO_FIELD_UPDATE_VALUE,
        fieldName: 'ssoName',
        value: 'something-else'
      })).toEqual({
        ssoName: {
          value: 'something-else'
        }
      });
    });

    it('should handle field update pending state', () => {
      expect(callReducer(reducers.fields, {
        type: actions.SSO_FIELD_UPDATE_PENDING,
        fieldName: 'ssoName',
        isPending: true
      })).toEqual({
        ssoName: {
          isPending: true
        }
      });

      expect(callReducer(reducers.fields, {
        type: actions.SSO_FIELD_UPDATE_PENDING,
        fieldName: 'ssoName',
        isPending: false
      })).toEqual({
        ssoName: {
          isPending: false
        }
      });
    });

    it('should handle field validation success state', () => {
      expect(callReducer(reducers.fields, {
        type: actions.SSO_FIELD_VALIDATION_SUCCESS,
        fieldName: 'ssoName'
      })).toEqual({
        ssoName: {
          error: null
        }
      });
    });

    it('should handle field update and validation failure states', () => {
      const error = new Error('Bad field');

      expect(callReducer(reducers.fields, {
        type: actions.SSO_FIELD_VALIDATION_FAILURE,
        fieldName: 'ssoName',
        error
      })).toEqual({
        ssoName: {
          error: error.message
        }
      });

      expect(callReducer(reducers.fields, {
        type: actions.SSO_FIELD_UPDATE_FAILURE,
        fieldName: 'ssoName',
        error
      })).toEqual({
        ssoName: {
          error: error.message
        }
      });
    });
  });
});
