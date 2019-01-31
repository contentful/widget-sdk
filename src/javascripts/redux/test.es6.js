import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import reducers from './reducer/index.es6';

/*
  A basic mocked store that has all the reducers from the application
  but none of the middleware besides redux-thunk. Creates and exposes the
  Redux store, plus some helpers (e.g. the easy ability to get actions fired
  since store instantiation).
 */
export default function createMockStore() {
  const actions = [];
  const dispatched = [];

  /*
    A middleware that takes every action and saves it into the `actions`
    array above.

    Actions saved can be retrieved using `getActions`.
   */
  const saveActionsMiddleware = () => next => action => {
    if (action.type !== '__SET_STATE__') {
      actions.push(action);
    }

    next(action);
  };

  /*
    Reducer that encapsulates state setting logic.

    If the setState method is called, we set the state
    to the given state from the action.
   */
  const rootReducer = (state, action) => {
    if (action.type === '__SET_STATE__') {
      state = action.state;
    }

    return reducers(state, action);
  }

  const store = createStore(
    rootReducer,
    applyMiddleware(thunk, saveActionsMiddleware)
  );

  const setState = state => {
    store.dispatch({ type: '__SET_STATE__', state });
  }

  // Get the original dispatch function from the store
  // and add a wrapper to save the type of arg dispatched,
  // either a thunk (another function) or an action
  const originalDispatch = store.dispatch;

  const dispatch = toDispatch => {
    if (typeof toDispatch === 'function') {
      dispatched.push('thunk');
    } else {
      dispatched.push('action');
    }

    return originalDispatch(toDispatch);
  }

  store.dispatch = dispatch;

  return {
    // Mocked store that acts like the application's Redux store, but also handles
    // specific test related things like retrieving actions.
    store,

    // Dispatch shortcut
    dispatch: store.dispatch,

    // Set the state in the store
    setState,

    // Gets all actions since the last reset or initialization
    getActions: () => [].concat(actions),

    // Gets all dispatched types (thunk or action)
    getDispatched: () => [].concat(dispatched),
  };
}
