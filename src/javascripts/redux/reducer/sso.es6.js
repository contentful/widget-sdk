import { set } from 'lodash';
import { combineReducers } from 'redux';
import * as actions from 'redux/actions/sso/actions.es6';

export default combineReducers({
  identityProvider,
  fields
});

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
    default:
      return state;
  }
}

export function fields(state = {}, action) {
  switch (action.type) {
    case actions.SSO_FIELD_UPDATE_VALUE:
      set(state, [action.fieldName, 'value'], action.value);

      return state;
    case actions.SSO_FIELD_UPDATE_PENDING:
      set(fields, [action.fieldName, 'isPending'], action.isPending);

      return state;
    case actions.SSO_FIELD_UPDATE_FAILURE:
      set(fields, [action.fieldName, 'error'], action.error);

      return state;
    default:
      return state;
  }
}
