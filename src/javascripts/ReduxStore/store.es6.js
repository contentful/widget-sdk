import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import combinedReducers from './reducers.es6';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(combinedReducers, composeEnhancers(applyMiddleware(thunk)));

export default store;
