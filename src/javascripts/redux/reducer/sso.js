import { get, set, clone } from 'lodash';
import { combineReducers } from 'redux';
import * as actions from 'redux/actions/sso/actions';

export default combineReducers({
  identityProvider,
  fields,
  connectionTest,
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
    case actions.SSO_GET_IDENTITY_PROVIDER_PENDING:
      return {
        ...state,
        isPending: true,
      };
    case actions.SSO_UPDATE_IDENTITY_PROVIDER:
    case actions.SSO_CREATE_IDENTITY_PROVIDER_SUCCESS:
    case actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS:
      return {
        ...state,
        data: action.payload,
        isPending: false,
      };
    case actions.SSO_CREATE_IDENTITY_PROVIDER_FAILURE:
    case actions.SSO_GET_IDENTITY_PROVIDER_FAILURE:
      return {
        ...state,
        error: action.payload.message,
        isPending: false,
      };

    case actions.SSO_ENABLE_PENDING:
      return {
        ...state,
        isEnabling: true,
      };
    case actions.SSO_ENABLE_SUCCESS:
      return {
        ...state,
        data: action.payload,
        isEnabling: false,
      };
    case actions.SSO_ENABLE_FAILURE:
      return {
        ...state,
        error: action.payload.message,
        isEnabling: false,
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
    value: String
  }

 */
const fieldNames = ['idpSsoTargetUrl', 'idpCert', 'ssoName', 'idpName'];

export function fields(state = {}, action) {
  switch (action.type) {
    case actions.SSO_CREATE_IDENTITY_PROVIDER_SUCCESS:
    case actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS: {
      const updatedState = clone(state);

      fieldNames.forEach((field) => {
        let fieldValue = get(action.payload, field);

        // If the field is null or undefined, we default to empty string
        if (fieldValue == null) {
          fieldValue = '';
        }

        set(updatedState, [field, 'value'], fieldValue);
      });

      return updatedState;
    }
    case actions.SSO_FIELD_UPDATE_VALUE: {
      const updatedState = clone(state);
      set(updatedState, [action.meta.fieldName, 'value'], action.payload);

      return updatedState;
    }
    case actions.SSO_FIELD_UPDATE_PENDING: {
      const updatedState = clone(state);
      set(updatedState, [action.meta.fieldName, 'isPending'], true);

      return updatedState;
    }
    case actions.SSO_FIELD_VALIDATION_SUCCESS:
    case actions.SSO_FIELD_UPDATE_SUCCESS: {
      const updatedState = clone(state);
      set(updatedState, [action.meta.fieldName, 'error'], null);
      set(updatedState, [action.meta.fieldName, 'isPending'], false);

      return updatedState;
    }
    case actions.SSO_FIELD_UPDATE_FAILURE:
    case actions.SSO_FIELD_VALIDATION_FAILURE: {
      const updatedState = clone(state);

      set(updatedState, [action.meta.fieldName, 'error'], action.payload.message);
      set(updatedState, [action.meta.fieldName, 'isPending'], false);

      return updatedState;
    }
    default:
      return state;
  }
}

/*
  The metadata related to the connection test.

  {
    isPending: Boolean,

    // Can be success, failure, or unknown
    result: String,
    errors: Array<String>
    timestamp: String,

    // Popup window reference
    testWindow: Window

    // Timer for checking if window is closed
    timer: Number
  }

 */
export function connectionTest(state = {}, action) {
  switch (action.type) {
    case actions.SSO_CONNECTION_TEST_START:
      return {
        ...state,
        isPending: true,
        testWindow: action.payload.testWindow,
        timer: action.payload.timer,
      };
    case actions.SSO_CONNECTION_TEST_END:
      return {
        ...state,
        isPending: false,
        testWindow: null,
        timer: null,
      };
    case actions.SSO_UPDATE_IDENTITY_PROVIDER:
    case actions.SSO_GET_IDENTITY_PROVIDER_SUCCESS:
      return {
        ...state,
        result: action.payload.testConnectionResult,
        errors: action.payload.testConnectionErrors,
        timestamp: action.payload.testConnectionAt,
      };
    default:
      return state;
  }
}
