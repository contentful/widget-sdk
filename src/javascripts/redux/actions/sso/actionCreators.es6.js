import { Notification } from '@contentful/forma-36-react-components';
import * as actions from './actions.es6';
import * as selectors from 'redux/selectors/sso.es6';
import { validate } from 'app/OrganizationSettings/SSO/utils.es6';
import { fieldErrorMessage, trackTestResult } from 'app/OrganizationSettings/SSO/utils.es6';
import { authUrl } from 'Config.es6';
import { track } from 'analytics/Analytics';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

export function retrieveIdp({ orgId }) {
  return async function retrieveIdp(dispatch) {
    dispatch(actions.ssoGetIdentityProviderPending());

    const endpoint = createOrganizationEndpoint(orgId);

    let idp;

    try {
      idp = await endpoint({
        method: 'GET',
        path: ['identity_provider']
      });
    } catch (e) {
      dispatch(actions.ssoGetIdentityProviderFailure(e));

      return;
    }

    dispatch(actions.ssoGetIdentityProviderSuccess(idp));
  };
}

export function createIdp({ orgId }) {
  return async dispatch => {
    const endpoint = createOrganizationEndpoint(orgId);

    dispatch(actions.ssoCreateIdentityProviderPending());

    let identityProvider;

    try {
      identityProvider = await endpoint({
        method: 'POST',
        path: ['identity_provider'],
        data: {
          ssoName: null
        }
      });
    } catch (e) {
      dispatch(actions.ssoCreateIdentityProviderFailure(e));

      return;
    }

    track('sso:start_setup');

    dispatch(actions.ssoCreateIdentityProviderSuccess(identityProvider));
  };
}

export function updateFieldValue({ fieldName, value, orgId }) {
  return async (dispatch, getState) => {
    // Exit early if the field value is pending (meaning the network request
    // from another call has not finished)
    const fieldIsPending = selectors.getField(getState(), fieldName).isPending;

    if (fieldIsPending) {
      return;
    }

    // Exit early if the idP value is the same as the updated value
    const idpValue = selectors.getIdentityProviderValue(getState(), fieldName);

    if (idpValue === value) {
      return;
    }

    // Validate field both in state and for this actionCreator
    dispatch(validateField({ fieldName, value }));

    // Exit early if field is not valid
    const isValid = validate(fieldName, value);

    if (!isValid) {
      return;
    }

    const version = selectors.getIdentityProviderVersion(getState());

    dispatch(actions.ssoFieldUpdateValue(fieldName, value));
    dispatch(actions.ssoFieldUpdatePending(fieldName));

    const endpoint = createOrganizationEndpoint(orgId);
    let identityProvider;

    try {
      identityProvider = await endpoint({
        method: 'PUT',
        path: ['identity_provider'],
        version,
        data: {
          [fieldName]: value
        }
      });
    } catch (e) {
      dispatch(
        actions.ssoFieldUpdateFailure(fieldName, fieldErrorMessage(fieldName, { api: true }))
      );

      return;
    }

    dispatch(actions.ssoFieldUpdateSuccess(fieldName));
    dispatch(actions.ssoUpdateIdentityProvider(identityProvider));
  };
}

export function validateField({ fieldName, value }) {
  return function validateField(dispatch, getState) {
    // If the current value is the same as the value in the state,
    // do nothing
    const field = selectors.getField(getState(), fieldName);

    if (field.value === value) {
      return;
    }

    // Always update the local field value
    dispatch(actions.ssoFieldUpdateValue(fieldName, value));

    const isValid = validate(fieldName, value);

    if (isValid) {
      dispatch(actions.ssoFieldValidationSuccess(fieldName));
    } else {
      dispatch(actions.ssoFieldValidationFailure(fieldName, fieldErrorMessage(fieldName)));
    }
  };
}

export function connectionTestStart({ orgId }) {
  return dispatch => {
    const testConnectionUrl = authUrl(`/sso/${orgId}/test_connection`);

    // Open the new window and check if it's closed every 250ms
    const testWindow = window.open(
      testConnectionUrl,
      '',
      'toolbar=0,status=0,width=650,height=800,left=250,top=200'
    );
    const timer = window.setInterval(() => dispatch(checkTestWindow({ orgId })), 250);

    dispatch(actions.ssoConnectionTestStart(testWindow, timer));
  };
}

export function connectionTestCancel({ orgId }) {
  return async (dispatch, getState) => {
    const testWindow = selectors.getConnectionTestWindow(getState());

    testWindow.close();

    dispatch(cleanupConnectionTest({ orgId }));
  };
}

export function enable({ orgId }) {
  return async dispatch => {
    dispatch(actions.ssoEnablePending());

    const endpoint = createOrganizationEndpoint(orgId);
    let identityProvider;

    try {
      identityProvider = await endpoint({
        method: 'POST',
        path: ['identity_provider', 'enable']
      });
    } catch (e) {
      dispatch(actions.ssoEnableFailure(e));

      Notification.error('Could not enable SSO. Try again.');

      return;
    }

    track('sso:enable');

    dispatch(actions.ssoEnableSuccess(identityProvider));

    Notification.success('SSO successfully enabled!');
  };
}

export function checkTestWindow({ orgId }) {
  return (dispatch, getState) => {
    const windowClosed = selectors.getConnectionTestWindow(getState()).closed;

    if (!windowClosed) {
      return;
    }

    dispatch(cleanupConnectionTest({ orgId }));
  };
}

export function cleanupConnectionTest({ orgId }) {
  return async function cleanupConnectionTest(dispatch, getState) {
    const timer = selectors.getConnectionTestIntervalTimer(getState());

    window.clearInterval(timer);

    await dispatch(retrieveIdp({ orgId }));

    const testData = selectors.getConnectionTest(getState());

    trackTestResult(testData);

    dispatch(actions.ssoConnectionTestEnd());
  };
}
