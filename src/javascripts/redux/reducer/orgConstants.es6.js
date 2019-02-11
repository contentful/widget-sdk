import * as actions from 'redux/actions/orgConstants/actions.es6';

export default (state = {}, { type, payload }) => {
  switch (type) {
    case actions.ORG_CONSTANTS_PENDING: {
      return { ...state, [payload.orgId]: { meta: { isPending: true } } };
    }

    case actions.ORG_CONSTANTS_SUCCESS: {
      return { ...state, [payload.orgId]: { ...payload.data, meta: { isPending: false } } };
    }

    case actions.ORG_CONSTANTS_ERROR: {
      return { ...state, [payload.orgId]: { error: payload.error, meta: { isPending: false } } };
    }

    default:
      return state;
  }
};
