import { Notification } from '@contentful/forma-36-react-components';
import * as actions from './actions.es6';
import * as selectors from 'redux/selectors/sso.es6';
import { validate, connectionTestResultFromIdp } from 'app/OrganizationSettings/SSO/utils.es6';
import { TEST_RESULTS } from 'app/OrganizationSettings/SSO/constants.es6';
import _ from 'lodash';

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

    if (idp.testConnectionAt) {
      const testResult = connectionTestResultFromIdp(idp);

      dispatch(connectionTestResult({ data: testResult }));
    }
  };
}

export function createIdp({ orgId, orgName }) {
  return async dispatch => {
    const endpoint = createOrganizationEndpoint(orgId);

    dispatch(actions.ssoCreateIdentityProviderPending());

    let identityProvider;

    try {
      identityProvider = await endpoint({
        method: 'POST',
        path: ['identity_provider'],
        data: {
          ssoName: _.kebabCase(orgName)
        }
      });
    } catch (e) {
      dispatch(actions.ssoCreateIdentityProviderFailure(e));

      return;
    }

    dispatch(actions.ssoCreateIdentityProviderSuccess(identityProvider));
  };
}

export function updateFieldValue({ fieldName, value, orgId }) {
  return async (dispatch, getState) => {
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
      dispatch(actions.ssoFieldUpdateFailure(fieldName, new Error('Field is not valid')));

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
      dispatch(actions.ssoFieldValidationFailure(fieldName, new Error('Field is not valid')));
    }
  };
}

export function connectionTestStart() {
  return dispatch => {
    dispatch(actions.ssoConnectionTestStart());
  };
}

export function connectionTestCancel() {
  return dispatch => {
    dispatch(actions.ssoConnectionTestEnd());
  };
}

export function connectionTestResult({ data }) {
  return function connectionTestResult(dispatch) {
    if (data.testConnectionAt) {
      if (data.testConnectionResult === TEST_RESULTS.success) {
        dispatch(actions.ssoConnectionTestSuccess());
      } else if (data.testConnectionResult === TEST_RESULTS.failure) {
        dispatch(actions.ssoConnectionTestFailure(data.testConnectionError));
      } else {
        dispatch(actions.ssoConnectionTestUnknown());
      }
    }
  };
}

export function connectionTestEnd({ orgId }) {
  return async dispatch => {
    await dispatch(retrieveIdp({ orgId }));
    dispatch(actions.ssoConnectionTestEnd());
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

      return;
    }

    dispatch(actions.ssoEnableSuccess(identityProvider));

    Notification.success('SSO successfully enabled!');
  };
}
