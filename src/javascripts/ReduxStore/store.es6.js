import { user$, organizations$, spacesByOrganization$ } from 'services/TokenStore.es6';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import * as kefir from '../utils/kefir.es6';

import combinedReducers from './reducers.es6';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(combinedReducers, composeEnhancers(applyMiddleware(thunk)));

if (kefir && kefir.onValue) {
  kefir.onValue(user$, user =>
    store.dispatch({
      type: 'USER_UPDATE_FROM_TOKEN',
      payload: { user }
    })
  );
  kefir.onValue(organizations$, organization =>
    store.dispatch({
      type: 'ORGANIZATIONS_UPDATE_FROM_TOKEN',
      payload: { organization }
    })
  );
  kefir.onValue(spacesByOrganization$, spaces =>
    store.dispatch({
      type: 'SPACES_BY_ORG_UPDATE_FROM_TOKEN',
      payload: { spaces }
    })
  );
}

export default store;
