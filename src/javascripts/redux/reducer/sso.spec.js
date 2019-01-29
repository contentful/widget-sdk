import * as reducers from './sso.es6';
import * as actions from 'redux/actions/sso/actions.es6';

const callReducer = (reducer, action) => {
  return reducer(null, action);
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
});
