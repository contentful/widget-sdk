import _ from 'lodash';
import * as actionCreators from './actionCreators.es6';
import * as actions from './actions.es6';
import createMockStore from 'redux/utils/createMockStore.es6';
import { mockEndpoint } from 'data/EndpointFactory.es6';
import { TEST_RESULTS } from 'app/OrganizationSettings/SSO/constants.es6';
import { Notification } from '@contentful/forma-36-react-components';

describe('SSO Redux actionCreators', () => {
  let mockStore;
  let notificationSuccessSpy;

  beforeEach(() => {
    mockStore = createMockStore();
    mockEndpoint.mockReset();

    notificationSuccessSpy = jest.spyOn(Notification, 'success');
  });

  afterEach(() => {
    notificationSuccessSpy.mockRestore();
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
            payload: identityProvider
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
            error: true,
            payload: error
          }
        ]);
      });
    });

    it('should dispatch the connectionTestResult thunk only if a connection test timestamp is present', async () => {
      const identityProvider = {
        testConnectionAt: '2019-02-11T16:35:35Z',
        sys: {
          version: 1
        }
      };

      // With testConnectionAt
      mockStore = createMockStore();

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      await mockStore.dispatch(actionCreators.retrieveIdp({ orgId: '1234' }));

      expect(mockStore.getDispatched()[3].thunkName()).toBe('connectionTestResult');

      // Without testConnectionAt
      mockStore = createMockStore();

      mockEndpoint.mockResolvedValueOnce({});

      await mockStore.dispatch(actionCreators.retrieveIdp({ orgId: '1234' }));

      expect(mockStore.getDispatched()[3]).toBeUndefined();
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
              payload: identityProvider
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
              error: true,
              payload: error
            }
          ]);
        });
    });
  });

  describe('updateFieldValue', () => {
    it('should always dispatch the validateField thunk when dispatched', async () => {
      const idpSsoTargetUrlValue = 'http://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName: 'idpSsoTargetUrl',
          value: idpSsoTargetUrlValue
        })
      );

      expect(mockStore.getDispatched()[1].thunkName()).toBe('validateField');

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName: 'idpSsoTargetUrl',
          value: idpSsoTargetUrlValue
        })
      );

      expect(mockStore.getDispatched()[5].thunkName()).toBe('validateField');
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
            payload: value,
            meta: { fieldName }
          },
          {
            type: actions.SSO_FIELD_UPDATE_PENDING,
            meta: { fieldName }
          },
          {
            type: actions.SSO_FIELD_UPDATE_SUCCESS,
            meta: { fieldName }
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
            payload: identityProvider
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
            payload: value,
            meta: { fieldName }
          },
          {
            type: actions.SSO_FIELD_UPDATE_PENDING,
            meta: { fieldName }
          },
          {
            type: actions.SSO_FIELD_UPDATE_FAILURE,
            error: true,
            payload: error,
            meta: { fieldName }
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
          payload: value,
          meta: { fieldName }
        },
        {
          type: actions.SSO_FIELD_VALIDATION_SUCCESS,
          meta: { fieldName }
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
          payload: value,
          meta: { fieldName }
        },
        {
          type: actions.SSO_FIELD_VALIDATION_FAILURE,
          error: true,
          payload: new Error('Field is not valid'),
          meta: { fieldName }
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
          payload: value,
          meta: { fieldName }
        },
        {
          type: actions.SSO_FIELD_VALIDATION_FAILURE,
          error: true,
          payload: new Error('Field is not valid'),
          meta: { fieldName }
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
          payload: value,
          meta: { fieldName }
        },
        {
          type: actions.SSO_FIELD_VALIDATION_SUCCESS,
          meta: { fieldName }
        }
      ]);
    });
  });

  describe('connectionTestStart', () => {
    it('should just dispatch the ssoTestConnectionStart action', () => {
      mockStore.dispatch(actionCreators.connectionTestStart());

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_CONNECTION_TEST_START
        }
      ]);
    });
  });

  describe('connectionTestCancel', () => {
    it('should just dispatch the ssoTestConnectionEnd action', () => {
      mockStore.dispatch(actionCreators.connectionTestCancel());

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_CONNECTION_TEST_END
        }
      ]);
    });
  });

  describe('connectionTestResult', () => {
    it('should not dispatch anything if the data has no testConnectionAt', () => {
      const data = {};

      mockStore.dispatch(actionCreators.connectionTestResult({ data }));

      expect(mockStore.getActions()).toHaveLength(0);
    });

    it('should dispatch the ssoConnectionTestSuccess action if testConnectionResult is success', () => {
      const data = {
        testConnectionAt: 'timestamp',
        testConnectionResult: TEST_RESULTS.success
      };

      mockStore.dispatch(actionCreators.connectionTestResult({ data }));

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_CONNECTION_TEST_SUCCESS
        }
      ]);
    });

    it('should dispatch the ssoConnectionTestFailure action if testConnectionResult is failure', () => {
      const testConnectionError = ['Something bad happened!'];

      const data = {
        testConnectionAt: 'timestamp',
        testConnectionResult: TEST_RESULTS.failure,
        testConnectionError
      };

      mockStore.dispatch(actionCreators.connectionTestResult({ data }));

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_CONNECTION_TEST_FAILURE,
          error: true,
          payload: testConnectionError
        }
      ]);
    });

    it('should dispatch the ssoConnectionTestUnknown action if the testConnectionResult is not success/failure', () => {
      const data = {
        testConnectionAt: 'timestamp',
        testConnectionResult: null
      };

      mockStore.dispatch(actionCreators.connectionTestResult({ data }));

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_CONNECTION_TEST_UNKNOWN
        }
      ]);
    });
  });

  describe('connectionTestEnd', () => {
    it('should dispatch the retrieveIdp thunk and then ssoConnectionTestEnd action', async () => {
      // retrieveIdp makes this async call
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      await mockStore.dispatch(actionCreators.connectionTestEnd({ orgId: 'org_1234' }));

      expect(mockStore.getDispatched()[1].thunkName()).toBe('retrieveIdp');
      expect(_.last(mockStore.getActions())).toEqual({
        type: actions.SSO_CONNECTION_TEST_END
      });
    });
  });

  describe('enable', () => {
    it('should go through the success flow if the IDP was enabled successfully via the API', async () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      await mockStore.dispatch(actionCreators.enable({ orgId: '1234' }));

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_ENABLE_PENDING
        },
        {
          type: actions.SSO_ENABLE_SUCCESS,
          payload: identityProvider
        }
      ]);
    });

    it('should fire a successful notification upon enabling', async () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      await mockStore.dispatch(actionCreators.enable({ orgId: '1234' }));

      expect(notificationSuccessSpy).toHaveBeenCalledTimes(1);
      expect(notificationSuccessSpy).toHaveBeenNthCalledWith(1, expect.any(String));
    });

    it('should go through the failure flow if the IDP was not successfully enabled via the API', async () => {
      const error = new Error('Could not enable SSO');

      mockEndpoint.mockRejectedValueOnce(error);

      await mockStore.dispatch(actionCreators.enable({ orgId: '1234' }));

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_ENABLE_PENDING
        },
        {
          type: actions.SSO_ENABLE_FAILURE,
          error: true,
          payload: error
        }
      ]);
    });
  });
});
