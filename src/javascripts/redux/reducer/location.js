// Guide about flows: https://contentful.atlassian.net/wiki/spaces/BH/pages/1279721792

// Action structure follows this guideline: https://github.com/redux-utilities/flux-standard-actions
export default (state = null, { type, payload }) => {
  switch (type) {
    case 'LOCATION_CHANGED':
      return payload.location;
    // remove item from the application state while the server request is still pending
    case 'REMOVE_FROM_DATASET': {
      return state;
    }
    default:
      return state;
  }
};
