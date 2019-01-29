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

    // TODO tomorrow
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

export function updateFieldValue({ fieldName, value }) {
  return dispatch => {
    dispatch(actions.ssoFieldUpdateValue(fieldName, value));
  };
}

export function validateField({ fieldName, value, orgId }) {
  return async (dispatch, getState) => {
    // We get the current state of this field
    //
    // If the current value is the same as the  value in the state,
    // do nothing
    const field = selectors.getField(getState(), fieldName);

    if (field.value === value) {
      return;
    }

    dispatch(actions.ssoFieldUpdatePending(fieldName, true));

    // Validate the field first
    const isValid = validate(fieldName, value);

    if (!isValid) {
      dispatch(actions.ssoFieldUpdateFailure(fieldName, 'Field is not valid'));
      dispatch(actions.ssoFieldUpdatePending(fieldName, false));

      return;
    }

    const endpoint = createOrganizationEndpoint(orgId);

    try {
      await endpoint({
        method: 'PUT',
        path: ['identity_provider'],
        data: {
          [fieldName]: value
        }
      });
    } catch (e) {
      dispatch(actions.ssoFieldUpdateFailure(fieldName, 'Field is not valid'));
      dispatch(actions.ssoFieldUpdatePending(fieldName, false));

      return;
    }

    dispatch(actions.ssoFieldUpdateSuccess(fieldName));
    dispatch(actions.ssoFieldUpdatePending(fieldName, false));
  };
}
