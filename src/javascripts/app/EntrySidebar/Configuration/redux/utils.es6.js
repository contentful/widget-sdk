import produce from 'immer';

export function createImmerReducer(initialState, handlers) {
  return produce((state = initialState, action) => {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    } else {
      return state;
    }
  });
}
