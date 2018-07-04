import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import combinedReducers from './reducers';

const store = createStore(
  combinedReducers,
  applyMiddleware(thunk)
);

export default store;
