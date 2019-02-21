import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import _ from 'lodash';

import reducers from '../reducer/index.es6';

/*
  Creates a wrapper for a dispatched thunk or action. Returns an object
  with four properties:

  isThunk:
    function that denotes if the dispatched value is a thunk.
  isAction:
    function that denotes if the dispatched value is an action, e.g.
    a plain object.
  thunkName:
    the name of the thunk dispatched.

    If the thunk dispatched is an anonymous function, it will return
    the value "anonymous". If you see this in your tests make sure you
    name the inner function that is dispatched.

  actionValue:
    the value of the action dispatched.
 */
function dispatchWrapper(dispatched) {
  return {
    isThunk: function() {
      return typeof dispatched === 'function';
    },
    isAction: function() {
      return _.isPlainObject(dispatched);
    },
    thunkName: function() {
      if (this.isThunk()) {
        const name = dispatched.name;
        const thunkName = name === '' ? 'anonymous' : name;

        return thunkName;
      } else {
        return null;
      }
    },
    actionValue: function() {
      if (this.isAction()) {
        return dispatched;
      } else {
        return null;
      }
    }
  };
}

/*
  A basic mocked store that has all the reducers from the application
  but none of the middleware besides redux-thunk. Creates and exposes the
  Redux store, plus some helpers (e.g. the easy ability to get actions fired
  since store instantiation).
 */
export default function createMockStore() {
  const dispatched = [];

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
  };

  /*
    A middleware to log everything dispatched. See `#dispatchWrapper` for more
    information on the value pushed to the `dispatched` array.
   */
  const logDispatches = () => next => thunkOrAction => {
    if (_.isPlainObject(thunkOrAction) && thunkOrAction.type === '__SET_STATE__') {
      return next(thunkOrAction);
    }

    dispatched.push(dispatchWrapper(thunkOrAction));

    return next(thunkOrAction);
  };

  const store = createStore(rootReducer, applyMiddleware(logDispatches, thunk));

  const setState = state => {
    store.dispatch({ type: '__SET_STATE__', state });
  };

  return {
    // Mocked store that acts like the application's Redux store, but also handles
    // specific test related things like retrieving actions.
    store,

    // Dispatch shortcut
    dispatch: store.dispatch,

    // Set the state in the store
    setState,

    // Gets all actions since the last reset or initialization
    getActions: () => dispatched.filter(d => d.isAction()).map(d => d.actionValue()),

    // Gets all dispatched types (thunk or action)
    getDispatched: () => [].concat(dispatched)
  };
}
