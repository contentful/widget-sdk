import _ from 'lodash';
import * as actionCreators from './actionCreators.es6';
import * as actions from './actions.es6';
import createMockStore from 'redux/test.es6';
import { mockEndpoint } from 'data/EndpointFactory.es6';

describe('SSO Redux actionCreators', () => {
  let mockStore;

  beforeEach(() => {
    mockStore = createMockStore();
  });

  describe('retrieveIdp', () => {
    it('should go through the success flow if the endpoint returns an identity provider', () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      mockStore.dispatch(actionCreators.retrieveIdp({ orgId: '1234' })).then(() => {
        expect(mockStore.getActions()).toEqual([
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_PENDING,
            isPending: true
          },
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS,
            identityProvider
          },
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_PENDING,
            isPending: false
          }
        ]);
      });
    });

    it('should go through the failure flow if the endpoint errors', () => {
      const error = new Error('Something bad happened');

      mockEndpoint.mockRejectedValueOnce(error);

      mockStore.dispatch(actionCreators.retrieveIdp({ orgId: '1234' })).then(() => {
        expect(mockStore.getActions()).toEqual([
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_PENDING,
            isPending: true
          },
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_FAILURE,
            error
          },
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_PENDING,
            isPending: false
          }
        ]);
      });
    });
  });

  describe('createIdp', () => {
    it('should go through the success flow if the endpoint successfully creates the idP', () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      mockStore.dispatch(actionCreators.createIdp({ orgId: '1234', orgName: 'Testing 1234' })).then(() => {
        expect(mockStore.getActions()).toEqual([
          {
            type: actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING,
            isPending: true
          },
          {
            type: actions.SSO_CREATE_IDENTITY_PROVIDER_SUCCESS,
            identityProvider
          },
          {
            type: actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING,
            isPending: false
          }
        ]);
      });
    });

    it('should set the ssoName as a kebab-case version of the org name when creating', () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      mockStore.dispatch(actionCreators.createIdp({ orgId: '1234', orgName: 'Testing 1234' })).then(() => {
        expect(mockEndpoint).toHaveBeenLastCalledWith(
          expect.objectContaining({
            method: expect.any(String),
            path: expect.any(Array),
            data: {
              ssoName: _.kebabCase('Testing 1234')
            }
          })
        );
      });
    });

    it('should go through the error flow if the endpoint errors', () => {
      const error = new Error('Something bad happened');

      mockEndpoint.mockRejectedValueOnce(error);

      mockStore.dispatch(actionCreators.createIdp({ orgId: '1234', orgName: 'Testing 1234' })).then(() => {
        expect(mockStore.getActions()).toEqual([
          {
            type: actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING,
            isPending: true
          },
          {
            type: actions.SSO_CREATE_IDENTITY_PROVIDER_FAILURE,
            error
          },
          {
            type: actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING,
            isPending: false
          }
        ]);
      });
    });
  });
});
