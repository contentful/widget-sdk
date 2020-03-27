import produce from 'immer';

export function createImmerReducer(handlers) {
  return (state, action) =>
    produce(state, (draft) => {
      if (handlers.hasOwnProperty(action.type)) {
        return handlers[action.type](draft, action);
      }
    });
}
