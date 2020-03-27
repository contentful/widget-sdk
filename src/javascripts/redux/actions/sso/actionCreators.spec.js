import _ from 'lodash';
import * as actionCreators from './actionCreators';
import * as actions from './actions';
import createMockStore from 'redux/utils/createMockStore';
import { mockEndpoint } from 'data/EndpointFactory';
import { Notification } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics';
import * as ssoUtils from 'app/OrganizationSettings/SSO/utils';

describe('SSO Redux actionCreators', () => {
  let mockStore;
  let notificationSuccessSpy;
  let notificationErrorSpy;
  let trackTestResultSpy;

  beforeEach(() => {
    mockStore = createMockStore();
    mockEndpoint.mockReset();

    notificationSuccessSpy = jest.spyOn(Notification, 'success');
    notificationErrorSpy = jest.spyOn(Notification, 'error');
    trackTestResultSpy = jest.spyOn(ssoUtils, 'trackTestResult');
  });

  afterEach(() => {
    notificationSuccessSpy.mockRestore();
    notificationErrorSpy.mockRestore();
    trackTestResultSpy.mockRestore();

    track.mockClear();
  });

  describe('retrieveIdp', () => {
    it('should go through the success flow if the endpoint returns an identity provider', () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      mockStore.dispatch(actionCreators.retrieveIdp({ orgId: '1234' })).then(() => {
        expect(mockStore.getActions()).toEqual([
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_PENDING,
          },
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS,
            payload: identityProvider,
          },
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
          },
          {
            type: actions.SSO_GET_IDENTITY_PROVIDER_FAILURE,
            error: true,
            payload: error,
          },
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
              type: actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING,
            },
            {
              type: actions.SSO_CREATE_IDENTITY_PROVIDER_SUCCESS,
              payload: identityProvider,
            },
          ]);
        });
    });

    it('should send a null ssoName when creating', () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      mockStore.dispatch(actionCreators.createIdp({ orgId: '1234' })).then(() => {
        expect(mockEndpoint).toHaveBeenLastCalledWith(
          expect.objectContaining({
            method: expect.any(String),
            path: expect.any(Array),
            data: {
              ssoName: null,
            },
          })
        );
      });
    });

    it('should fire the start_setup event when creating', async () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      await mockStore.dispatch(actionCreators.createIdp({ orgId: '1234' }));

      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenNthCalledWith(1, 'sso:start_setup');
    });

    it('should go through the error flow if the endpoint errors', () => {
      const error = new Error('Something bad happened');

      mockEndpoint.mockRejectedValueOnce(error);

      mockStore
        .dispatch(actionCreators.createIdp({ orgId: '1234', orgName: 'Testing 1234' }))
        .then(() => {
          expect(mockStore.getActions()).toEqual([
            {
              type: actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING,
            },
            {
              type: actions.SSO_CREATE_IDENTITY_PROVIDER_FAILURE,
              error: true,
              payload: error,
            },
          ]);
        });
    });
  });

  describe('updateFieldValue', () => {
    it('should not dispatch anything if the field is pending', async () => {
      mockStore.setState({
        sso: {
          fields: {
            idpSsoTargetUrl: {
              isPending: true,
            },
          },
        },
      });

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName: 'idpSsoTargetUrl',
          value: 'some-value',
        })
      );

      // Only the initial dispatch but no others
      expect(mockStore.getDispatched()).toHaveLength(1);
    });

    it('should dispatch the validateField thunk when dispatched if the field is not pending', async () => {
      const idpSsoTargetUrlValue = 'http://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName: 'idpSsoTargetUrl',
          value: idpSsoTargetUrlValue,
        })
      );

      expect(mockStore.getDispatched()[1].thunkName()).toBe('validateField');

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName: 'idpSsoTargetUrl',
          value: idpSsoTargetUrlValue,
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
          value: idpSsoTargetUrlValue,
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
              idpSsoTargetUrl: 'https://example.com',
            },
          },
        },
      };

      mockStore.setState(state);

      const fieldName = 'idpSsoTargetUrl';
      const value = 'https://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName,
          value,
        })
      );

      expect(mockEndpoint).not.toHaveBeenCalled();
    });

    it('should go through the success flow if the field update was successful on the API', async () => {
      const identityProvider = {
        ssoName: 'something-1234',
      };

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      const fieldName = 'idpSsoTargetUrl';
      const value = 'https://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName,
          value,
        })
      );

      expect(mockStore.getActions()).toEqual(
        expect.arrayContaining([
          {
            type: actions.SSO_FIELD_UPDATE_VALUE,
            payload: value,
            meta: { fieldName },
          },
          {
            type: actions.SSO_FIELD_UPDATE_PENDING,
            meta: { fieldName },
          },
          {
            type: actions.SSO_FIELD_UPDATE_SUCCESS,
            meta: { fieldName },
          },
        ])
      );
    });

    it('should update the identity provider if the field update was successful on the API', async () => {
      const identityProvider = {
        ssoName: 'something-1234',
      };

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      const fieldName = 'idpSsoTargetUrl';
      const value = 'https://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName,
          value,
        })
      );

      expect(mockStore.getActions()).toEqual(
        expect.arrayContaining([
          {
            type: actions.SSO_UPDATE_IDENTITY_PROVIDER,
            payload: identityProvider,
          },
        ])
      );
    });

    it('should go through the failure flow if the field update was unsuccessful on the API', async () => {
      mockEndpoint.mockRejectedValueOnce(new Error());

      const fieldName = 'idpSsoTargetUrl';
      const value = 'https://example.com';

      await mockStore.dispatch(
        actionCreators.updateFieldValue({
          orgId: '1234',
          fieldName,
          value,
        })
      );

      expect(mockStore.getActions()).toEqual(
        expect.arrayContaining([
          {
            type: actions.SSO_FIELD_UPDATE_VALUE,
            payload: value,
            meta: { fieldName },
          },
          {
            type: actions.SSO_FIELD_UPDATE_PENDING,
            meta: { fieldName },
          },
          {
            type: actions.SSO_FIELD_UPDATE_FAILURE,
            error: true,
            payload: expect.any(Error),
            meta: { fieldName },
          },
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
              value: 'something-1234',
            },
          },
        },
      };

      mockStore.setState(state);

      const fieldName = 'ssoName';
      const value = 'something-1234';

      mockStore.dispatch(
        actionCreators.validateField({
          orgId: '1234',
          fieldName,
          value,
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
          value,
        })
      );

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_FIELD_UPDATE_VALUE,
          payload: value,
          meta: { fieldName },
        },
        {
          type: actions.SSO_FIELD_VALIDATION_SUCCESS,
          meta: { fieldName },
        },
      ]);
    });

    it('should go through the failure flow if the validation is unsuccessful', () => {
      const fieldName = 'idpSsoTargetUrl';
      const value = 'http://example.com';

      mockStore.dispatch(
        actionCreators.validateField({
          orgId: '1234',
          fieldName,
          value,
        })
      );

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_FIELD_UPDATE_VALUE,
          payload: value,
          meta: { fieldName },
        },
        {
          type: actions.SSO_FIELD_VALIDATION_FAILURE,
          error: true,
          payload: expect.any(Error),
          meta: { fieldName },
        },
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
          value,
        })
      );

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_FIELD_UPDATE_VALUE,
          payload: value,
          meta: { fieldName },
        },
        {
          type: actions.SSO_FIELD_VALIDATION_FAILURE,
          error: true,
          payload: expect.any(Error),
          meta: { fieldName },
        },
      ]);

      mockStore = createMockStore();

      value = 'https://example.com';

      mockStore.dispatch(
        actionCreators.validateField({
          orgId: '1234',
          fieldName,
          value,
        })
      );

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_FIELD_UPDATE_VALUE,
          payload: value,
          meta: { fieldName },
        },
        {
          type: actions.SSO_FIELD_VALIDATION_SUCCESS,
          meta: { fieldName },
        },
      ]);
    });
  });

  describe('connectionTestStart', () => {
    const globalMocks = {};

    beforeEach(() => {
      globalMocks.open = jest.spyOn(global, 'open').mockReturnValue('window');
      globalMocks.setInterval = jest.spyOn(global, 'setInterval').mockReturnValue(12);
    });

    afterEach(() => {
      globalMocks.open.mockRestore();
      globalMocks.setInterval.mockRestore();
    });

    it('should open a new window and set a timer', () => {
      mockStore.dispatch(actionCreators.connectionTestStart({ orgId: 'org_1234' }));
      expect(globalMocks.open).toHaveBeenCalledTimes(1);
      expect(globalMocks.open).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/sso/org_1234/test_connection'),
        expect.any(String),
        expect.any(String)
      );

      expect(globalMocks.setInterval).toHaveBeenCalledTimes(1);
      expect(globalMocks.setInterval).toHaveBeenNthCalledWith(1, expect.any(Function), 250);
    });

    it('should dispatch the ssoConnectionTestStart action', () => {
      mockStore.dispatch(actionCreators.connectionTestStart({ orgId: 'org_1234' }));

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_CONNECTION_TEST_START,
          payload: {
            testWindow: 'window',
            timer: 12,
          },
        },
      ]);
    });
  });

  describe('connectionTestCancel', () => {
    let mockWindow;

    beforeEach(() => {
      mockWindow = {
        close: jest.fn(),
      };

      mockStore.setState({
        sso: {
          connectionTest: {
            testWindow: mockWindow,
          },
        },
      });

      mockEndpoint.mockResolvedValueOnce({});
    });

    it('should close the new window', () => {
      mockStore.dispatch(actionCreators.connectionTestCancel({ orgId: 'org_1234' }));

      expect(mockWindow.close).toHaveBeenCalledTimes(1);
    });

    it('should dispatch the cleanupConnectionTest thunk', () => {
      mockStore.dispatch(actionCreators.connectionTestCancel({ orgId: 'org_1234' }));

      expect(mockStore.getDispatched()[1].thunkName()).toBe('cleanupConnectionTest');
    });
  });

  describe('checkTestWindow', () => {
    beforeEach(() => {
      mockEndpoint.mockResolvedValueOnce({});
    });

    it('should dispatch nothing if the new window is not closed', () => {
      mockStore.setState({
        sso: {
          connectionTest: {
            testWindow: {
              closed: false,
            },
          },
        },
      });

      mockStore.dispatch(actionCreators.checkTestWindow({ orgId: 'org_1234' }));

      expect(mockStore.getDispatched()).toHaveLength(1);
    });

    it('should dispatch the cleanupConnectionTest thunk if the new window is closed', () => {
      mockStore.setState({
        sso: {
          connectionTest: {
            testWindow: {
              closed: true,
            },
          },
        },
      });

      mockStore.dispatch(actionCreators.checkTestWindow({ orgId: 'org_1234' }));

      expect(mockStore.getDispatched()[1].thunkName()).toBe('cleanupConnectionTest');
    });
  });

  describe('cleanupConnectionTest', () => {
    beforeEach(() => {
      mockEndpoint.mockResolvedValueOnce({});
    });

    it('should clear the timer', () => {
      const spy = jest.spyOn(global, 'clearInterval');

      mockStore.dispatch(actionCreators.cleanupConnectionTest({ orgId: 'org_1234' }));

      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });

    it('should dispatch the retrieveIdp thunk and then the ssoConnectionTestEnd action', async () => {
      await mockStore.dispatch(actionCreators.cleanupConnectionTest({ orgId: 'org_1234' }));

      expect(mockStore.getDispatched()[1].thunkName()).toBe('retrieveIdp');
      expect(_.last(mockStore.getDispatched()).actionValue()).toEqual({
        type: actions.SSO_CONNECTION_TEST_END,
      });
    });

    it('should fire the trackTestResult util', async () => {
      await mockStore.dispatch(actionCreators.cleanupConnectionTest({ orgId: 'org_1234' }));

      expect(trackTestResultSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('enable', () => {
    it('should go through the success flow if the IDP was enabled successfully via the API', async () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      await mockStore.dispatch(actionCreators.enable({ orgId: '1234' }));

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_ENABLE_PENDING,
        },
        {
          type: actions.SSO_ENABLE_SUCCESS,
          payload: identityProvider,
        },
      ]);
    });

    it('should fire a successful notification upon enabling', async () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      await mockStore.dispatch(actionCreators.enable({ orgId: '1234' }));

      expect(notificationSuccessSpy).toHaveBeenCalledTimes(1);
      expect(notificationSuccessSpy).toHaveBeenNthCalledWith(1, expect.any(String));
    });

    it('should fire the enable event upon enabling', async () => {
      const identityProvider = {};

      mockEndpoint.mockResolvedValueOnce(identityProvider);

      await mockStore.dispatch(actionCreators.enable({ orgId: '1234' }));

      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenNthCalledWith(1, 'sso:enable');
    });

    it('should go through the failure flow if the IDP was not successfully enabled via the API', async () => {
      const error = new Error('Could not enable SSO');

      mockEndpoint.mockRejectedValueOnce(error);

      await mockStore.dispatch(actionCreators.enable({ orgId: '1234' }));

      expect(mockStore.getActions()).toEqual([
        {
          type: actions.SSO_ENABLE_PENDING,
        },
        {
          type: actions.SSO_ENABLE_FAILURE,
          error: true,
          payload: error,
        },
      ]);
    });

    it('should fire an error notification when enabling errors', async () => {
      mockEndpoint.mockRejectedValueOnce(new Error());

      await mockStore.dispatch(actionCreators.enable({ orgId: '1234' }));

      expect(notificationErrorSpy).toHaveBeenCalledTimes(1);
      expect(notificationErrorSpy).toHaveBeenNthCalledWith(1, expect.any(String));
    });
  });
});
