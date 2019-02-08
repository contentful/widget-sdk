import _ from 'lodash';
import * as actionCreators from './actionCreators.es6';
import * as actions from './actions.es6';
import createMockStore from 'redux/test.es6';
import { mockEndpoint } from 'data/EndpointFactory.es6';

describe('SSO Redux actionCreators', () => {
  let mockStore;

  beforeEach(() => {
    mockStore = createMockStore();
    mockEndpoint.mockReset();
  });

  describe('retrieveIdp', () => {
    it('should go through the success flow if the endpoint returns an identity provider', () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      mockStore.dispatch(actionCreators.retrieveIdp({ orgId: '1234' })).then(() => {
        expect(mockStore.getActions()).toEqual([
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_PENDING
          },
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS,
            identityProvider
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
            type: actions.SSO_GET_IDENTITY_PROVIDER_PENDING
          },
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_FAILURE,
            error
          }
        ]);
      });
    });
  });

  describe('createIdp', () => {
    it('should go through the success flow if the endpoint successfully creates the idP', () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      mockStore
        .dispatch(actionCreators.createIdp({ orgId: '1234', orgName: 'Testing 1234' }))
        .then(() => {
          expect(mockStore.getActions()).toEqual([
            {
              type: actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING
            },
            {
              type: actions.SSO_CREATE_IDENTITY_PROVIDER_SUCCESS,
              identityProvider
            }
          ]);
        });
    });

    it('should set the ssoName as a kebab-case version of the org name when creating', () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      mockStore
        .dispatch(actionCreators.createIdp({ orgId: '1234', orgName: 'Testing 1234' }))
        .then(() => {
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

      mockStore
        .dispatch(actionCreators.createIdp({ orgId: '1234', orgName: 'Testing 1234' }))
        .then(() => {
          expect(mockStore.getActions()).toEqual([
            {
              type: actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING
            },
            {
              type: actions.SSO_CREATE_IDENTITY_PROVIDER_FAILURE,
              error
            }
          ]);
        });
    });
  });

  describe('updateFieldValue', () => {
    it('should always dispatch the validateField action when dispatched', async () => {
      // Using a non-https idpSsoTargetUrl to force validation failure
      const idpSsoTargetUrlValue = 'http://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName: 'idpSsoTargetUrl',
          value: idpSsoTargetUrlValue
        })
      );

      expect(mockStore.getDispatched()[0]).toBe('thunk');

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName: 'idpSsoTargetUrl',
          value: idpSsoTargetUrlValue
        })
      );

      expect(mockStore.getDispatched()[1]).toBe('thunk');
    });

    it('should not attempt to update the field on the API if the field is invalid', async () => {
      const idpSsoTargetUrlValue = 'http://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName: 'idpSsoTargetUrl',
          value: idpSsoTargetUrlValue
        })
      );

      expect(mockEndpoint).not.toHaveBeenCalled();
    });

    it('should not attempt to update the field if the field value is the same as the value in the idP', async () => {
      // Set the initial idP state
      const state = {
        sso: {
          identityProvider: {
            data: {
              idpSsoTargetUrl: 'https://example.com'
            }
          }
        }
      };

      mockStore.setState(state);

      const fieldName = 'idpSsoTargetUrl';
      const value = 'https://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName,
          value
        })
      );

      expect(mockEndpoint).not.toHaveBeenCalled();
    });

    it('should go through the success flow if the field update was successful on the API', async () => {
      const identityProvider = {
        ssoName: 'something-1234'
      };

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      const fieldName = 'idpSsoTargetUrl';
      const value = 'https://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName,
          value
        })
      );

      expect(mockStore.getActions()).toEqual(
        expect.arrayContaining([
          {
            type: actions.SSO_FIELD_UPDATE_VALUE,
            fieldName,
            value
          },
          {
            type: actions.SSO_FIELD_UPDATE_PENDING,
            fieldName
          },
          {
            type: actions.SSO_FIELD_UPDATE_SUCCESS,
            fieldName
          }
        ])
      );
    });

    it('should update the identity provider if the field update was successful on the API', async () => {
      const identityProvider = {
        ssoName: 'something-1234'
      };

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      const fieldName = 'idpSsoTargetUrl';
      const value = 'https://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName,
          value
        })
      );

      expect(mockStore.getActions()).toEqual(
        expect.arrayContaining([
          {
            type: actions.SSO_UPDATE_IDENTITY_PROVIDER,
            identityProvider
          }
        ])
      );
    });

    it('should go through the failure flow if the field update was unsuccessful on the API', async () => {
      const error = new Error('Field is not valid');

      mockEndpoint.mockRejectedValueOnce(error);

      const fieldName = 'idpSsoTargetUrl';
      const value = 'https://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName,
          value
        })
      );

      expect(mockStore.getActions()).toEqual(
        expect.arrayContaining([
          {
            type: actions.SSO_FIELD_UPDATE_VALUE,
            fieldName,
            value
          },
          {
            type: actions.SSO_FIELD_UPDATE_PENDING,
            fieldName
          },
          {
            type: actions.SSO_FIELD_UPDATE_FAILURE,
            fieldName,
            error
          }
        ])
      );
    });
  });

  describe('validateField', () => {
    it('should not attempt to validate or update if the current and updated field value is the same', () => {
      // Set the initial field state
      const state = {
        sso: {
          fields: {
            ssoName: {
              value: 'something-1234'
            }
          }
        }
      };

      mockStore.setState(state);

      const fieldName = 'ssoName';
      const value = 'something-1234';

      mockStore.dispatch(
        actionCreators.validateField({
          orgId: '1234',
          fieldName,
          value
        })
      );

      expect(mockStore.getActions()).toHaveLength(0);
    });

    it('should go through the success flow if the validation is successful', () => {
      const fieldName = 'idpSsoTargetUrl';
      const value = 'https://example.com';

      mockStore.dispatch(
        actionCreators.validateField({
          orgId: '1234',
          fieldName,
          value
        })
      );

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_FIELD_UPDATE_VALUE,
          fieldName,
          value
        },
        {
          type: actions.SSO_FIELD_VALIDATION_SUCCESS,
          fieldName
        }
      ]);
    });

    it('should go through the failure flow if the validation is unsuccessful', () => {
      const fieldName = 'idpSsoTargetUrl';
      const value = 'http://example.com';

      mockStore.dispatch(
        actionCreators.validateField({
          orgId: '1234',
          fieldName,
          value
        })
      );

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_FIELD_UPDATE_VALUE,
          fieldName,
          value
        },
        {
          type: actions.SSO_FIELD_VALIDATION_FAILURE,
          fieldName,
          error: new Error('Field is not valid')
        }
      ]);
    });

    it('should update the field value regardless of value validity if new value is different', () => {
      const fieldName = 'idpSsoTargetUrl';
      let value;

      mockStore = createMockStore();

      value = 'http://example.com';

      mockStore.dispatch(
        actionCreators.validateField({
          orgId: '1234',
          fieldName,
          value
        })
      );

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_FIELD_UPDATE_VALUE,
          fieldName,
          value
        },
        {
          type: actions.SSO_FIELD_VALIDATION_FAILURE,
          fieldName,
          error: new Error('Field is not valid')
        }
      ]);

      mockStore = createMockStore();

      value = 'https://example.com';

      mockStore.dispatch(
        actionCreators.validateField({
          orgId: '1234',
          fieldName,
          value
        })
      );

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_FIELD_UPDATE_VALUE,
          fieldName,
          value
        },
        {
          type: actions.SSO_FIELD_VALIDATION_SUCCESS,
          fieldName
        }
      ]);
    });
  });
});
