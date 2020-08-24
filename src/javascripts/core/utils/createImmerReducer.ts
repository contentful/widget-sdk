import produce, { Draft } from 'immer';

interface ActionWithType {
  type: string;
}

export function createImmerReducer<State, Action extends ActionWithType>(
  handlers: Record<string, (state: Draft<State>, action: Action) => void>
): (state: State, action: Action) => State {
  return (state, action) =>
    produce(state, (draft) => {
      if (Object.prototype.hasOwnProperty.call(handlers, action.type)) {
        return handlers[action.type](draft, action);
      }
    });
}
