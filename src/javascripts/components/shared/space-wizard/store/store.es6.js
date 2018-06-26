import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';

import * as reducers from './reducers';
import * as actions from './actions';

const wizardReducers = combineReducers(reducers);

const rootReducer = (state, action) => {
  // Handle the wizard reset event so that the state can be reset
  // when closing the modal
  if (action.type === actions.SPACE_WIZARD_RESET) {
    state = undefined;
  }

  return wizardReducers(state, action);
};

const store = createStore(
  rootReducer,
  applyMiddleware(thunk)
);

const dispatch = store.dispatch;

export default store;
export {
  dispatch
};
