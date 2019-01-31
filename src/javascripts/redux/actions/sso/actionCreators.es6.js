import * as actions from './actions.es6';
import * as selectors from 'redux/selectors/sso.es6';
import { validate } from 'app/OrganizationSettings/SSO/utils.es6';
import _ from 'lodash';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

export function retrieveIdp({ orgId }) {
  return async dispatch => {
    dispatch(actions.ssoGetIdentityProviderPending(true));

    const endpoint = createOrganizationEndpoint(orgId);

    let idp;

    try {
      idp = await endpoint({
        method: 'GET',
        path: ['identity_provider']
      });
    } catch (e) {
      dispatch(actions.ssoGetIdentityProviderFailure(e));
      dispatch(actions.ssoGetIdentityProviderPending(false));

      return;
    }

    dispatch(actions.ssoGetIdentityProviderSuccess(idp));
    dispatch(actions.ssoGetIdentityProviderPending(false));
  };
}

export function createIdp({ orgId, orgName }) {
  return async dispatch => {
    const endpoint = createOrganizationEndpoint(orgId);

    dispatch(actions.ssoCreateIdentityProviderPending(true));

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
      dispatch(actions.ssoCreateIdentityProviderPending(false));

      return;
    }

    dispatch(actions.ssoCreateIdentityProviderSuccess(identityProvider));
    dispatch(actions.ssoCreateIdentityProviderPending(false));
  };
}

export function updateFieldValue({ fieldName, value, orgId }) {
  return async (dispatch, getState) => {
    // Validate field both in state and for this actionCreator
    dispatch(validateField({ fieldName, value }));

    const isValid = validate(fieldName, value);

    if (!isValid) {
      return;
    }

    const version = selectors.getIdentityProviderVersion(getState());

    dispatch(actions.ssoFieldUpdateValue(fieldName, value));
    dispatch(actions.ssoFieldUpdatePending(fieldName, true));

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
      dispatch(actions.ssoFieldUpdatePending(fieldName, false));

      return;
    }

    dispatch(actions.ssoFieldUpdateSuccess(fieldName));
    dispatch(actions.ssoUpdateIdentityProvider(identityProvider));
    dispatch(actions.ssoFieldUpdatePending(fieldName, false));
  };
}

export function validateField({ fieldName, value }) {
  return (dispatch, getState) => {
    // We get the current state of this field
    //
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
