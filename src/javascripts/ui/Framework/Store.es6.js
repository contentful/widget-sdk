import { mapValues } from 'lodash';
import * as K from 'utils/kefir';
import { makeMatcher } from 'utils/TaggedValues';


/**
 * This module exports functions to deal with reducer based stores.
 */


/**
 * Create a Redux-like reducer store.
 *
 * The store takes an initial value and a reducer function with the signature
 * `(state, action) => state`. The reducer function is most likely
 * created with `makeReducer` below.
 *
 * A store has two properties.
 *
 * - `store.dispatch(ActionCtor, value)` creates an action
 *   `ActionCtor(value)` and calls the reducer with it an the current
 *   state.
 *
 * - `store.state$` is a Kefir property that holds the current state
 *   and updates when an action is dispatched and reduced.
 *
 *
 * Key differences from a redux store.
 *
 * - Arguments to `createStore` are flipped to make it harder to omit
 *   an initial value.
 * - `dispatch` takes an action constructor and a value instead of just
 *   one value.
 * - Exposes `$state` property instead of `subscribe`
 * - No `replaceReducer` method. Using it is an anti pattern.
 */
export function createStore (initial, reduce) {
  const stateBus = K.createPropertyBus(initial);
  const state$ = stateBus.property;

  return {
    state$,
    dispatch
  };

  function getState () {
    return K.getValue(state$);
  }

  function dispatch (actionCtor, value) {
    const action = actionCtor(value);
    const nextState = reduce(action, getState());
    stateBus.set(nextState);
  }
}

/**
 * Given a store and an object of action constructors it returns an
 * object with methods that dispatch actions on the store.
 *
 *     const actions = bindActions(store, {MyAction})
 *
 *     // The following are equivalent
 *     actions.MyAction('VALUE')
 *     store.dispatch(MyAction, 'Value')
 *
 * Similar to `bindActions` from redux.
 */
export function bindActions (store, actions) {
  return mapValues(actions, (ctor) => {
    return (value) => store.dispatch(ctor, value);
  });
}


/**
 * From an object that maps action tags to reducers create a function
 * that reduces any of the given actions.
 *
 *     const Add = makeCtor()
 *     const reduce = makeReducer({
 *       [Add]: (state, delta) => state + delta
 *     })
 *
 *     reduce(4, Add(2)) // => 6
 *
 * This is similar to `utils/TaggedValues.match` but flips the
 * arguments in the handler.
 */
export function makeReducer (handlers) {
  return makeMatcher(mapValues(handlers, (handle) => {
    return (value, state) => handle(state, value);
  }));
}
