import { get, set, clone } from 'lodash';
import { combineReducers } from 'redux';
import * as actions from 'redux/actions/sso/actions.es6';

export default combineReducers({
  identityProvider,
  fields
});

/*
  For SSO, there are two concepts to understand: the identity provider (idP) and the fields.

  The idP is the current information that is stored in Gatekeeper and is considered "golden",
  e.g. to be valid implicitly. The value in the state is the latest that the application knows
  from GK and is updated whenever the idP is updated.

  The fields are the current presentational values that are shown in the UI. The field values
  do include network information (to update the pending logic in the component) but should not
  be treated as valid implicitly.
 */

/*
  `identityProvider` is the state object that encapsulates
  all the current known data about the idP on GK.

  {
    // If the idP is in a pending state (get or create)
    isPending: Boolean,

    // The current idP data from GK
    data: IdentityProvider,

    // If an error is present
    // Will always be true if error is present
    error: Boolean(true)
  }
 */
export function identityProvider(state = {}, action) {
  switch (action.type) {
    case actions.SSO_CREATE_IDENTITY_PROVIDER_PENDING:
      return {
        ...state,
        isPending: action.isPending
      };
    case actions.SSO_CREATE_IDENTITY_PROVIDER_SUCCESS:
      return {
        ...state,
        data: action.identityProvider
      };
    case actions.SSO_CREATE_IDENTITY_PROVIDER_FAILURE:
      return {
        ...state,
        error: action.error
      };
    case actions.SSO_GET_IDENTITY_PROVIDER_PENDING:
      return {
        ...state,
        isPending: action.isPending
      };
    case actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS:
      return {
        ...state,
        data: action.identityProvider
      };
    case actions.SSO_GET_IDENTITY_PROVIDER_FAILURE:
      return {
        ...state,
        error: action.error
      };
    case actions.SSO_UPDATE_IDENTITY_PROVIDER:
      return {
        ...state,
        data: action.identityProvider
      };
    default:
      return state;
  }
}

/*
  The fields shown in the UI. Not necessarily what's in the idP on GK,
  since we want to always show the user's current value even if invalid

  Field shape:
  {
    isPending: Boolean,
    error: String,
    value: NullableString
  }

 */
const fieldNames = ['idpSsoTargetUrl', 'idpCert', 'ssoName', 'idpName'];

export function fields(state = {}, action) {
  switch (action.type) {
    case actions.SSO_CREATE_IDENTITY_PROVIDER_SUCCESS:
    case actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS: {
      const updatedState = clone(state);

      fieldNames.forEach(field => {
        const currentFieldValue = get(action.identityProvider, field);
        set(updatedState, [field, 'value'], currentFieldValue);
      });

      return updatedState;
    }
    case actions.SSO_FIELD_UPDATE_VALUE: {
      const updatedState = clone(state);
      set(updatedState, [action.fieldName, 'value'], action.value);

      return updatedState;
    }
    case actions.SSO_FIELD_UPDATE_PENDING: {
      const updatedState = clone(state);
      set(updatedState, [action.fieldName, 'isPending'], action.isPending);

      return updatedState;
    }
    case actions.SSO_FIELD_VALIDATION_SUCCESS: {
      const updatedState = clone(state);
      set(updatedState, [action.fieldName, 'error'], null);

      return updatedState;
    }
    case actions.SSO_FIELD_UPDATE_FAILURE:
    case actions.SSO_FIELD_VALIDATION_FAILURE: {
      const updatedState = clone(state);
      set(updatedState, [action.fieldName, 'error'], action.error.message);

      return updatedState;
    }
    default:
      return state;
  }
}
