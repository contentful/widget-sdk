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

  /*
    A middleware that takes every action and saves it into the `actions`
    array above.

    Actions saved can be retrieved using `getActions`.
   */
  const saveActionsMiddleware = () => next => action => {
    actions.push(action);

    next(action);
  };

  const store = createStore(
    reducers,
    applyMiddleware(thunk, saveActionsMiddleware)
  );

  return {
    // Mocked store that acts like the application's Redux store, but also handles
    // specific test related things like retrieving actions.
    store,

    // Dispatch shortcut
    dispatch: store.dispatch,

    // Gets all actions since the last reset or initialization
    getActions: () => [].concat(actions)
  };
}
