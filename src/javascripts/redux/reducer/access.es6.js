export default (state = { allowed: true }, { type, payload }) => {
  switch (type) {
    case 'ACCESS_DENIED': {
      return {
        allowed: false,
        reason: payload.reason
      };
    }
    case 'LOCATION_CHANGED': {
      return {
        allowed: true
      };
    }
    default:
      return state;
  }
};
