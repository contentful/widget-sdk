import immer from 'immer';

export function createImmerReducer(initialState, handlers) {
  return immer((state = initialState, action) => {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    } else {
      return state;
    }
  });
}

export function createAction(type, ...argNames) {
  const fn = (...args) => {
    const action = { type, payload: {} };
    argNames.forEach((_, index) => {
      action.payload[argNames[index]] = args[index];
    });
    return action;
  };
  fn.type = type;
  return fn;
}

export function createAsyncActions(baseType, { request, success, failure }) {
  return {
    request: createAction(`${baseType}$Request`, ...request),
    success: createAction(`${baseType}$Success`, ...success),
    failture: createAction(`${baseType}$Reject`, ...failure)
  };
}
