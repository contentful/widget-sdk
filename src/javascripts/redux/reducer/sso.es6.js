import { get, set, clone } from 'lodash';
import { combineReducers } from 'redux';
import * as actions from 'redux/actions/sso/actions.es6';

export default combineReducers({
  identityProvider,
  fields
});

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
