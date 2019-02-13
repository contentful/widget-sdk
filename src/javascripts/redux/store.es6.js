import { user$, organizations$, spacesByOrganization$ } from '../services/TokenStore.es6';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { onValue } from 'utils/kefir.es6';
import removeCircularRefs from 'utils/removeCircularRefs.es6';

import middlewares from './middlewares/index.es6';
import reducer from './reducer/index.es6';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(reducer, composeEnhancers(applyMiddleware(thunk, ...middlewares)));

if (user$ && organizations$ && spacesByOrganization$) {
  onValue(user$, user => {
    store.dispatch({
      type: 'USER_UPDATE_FROM_TOKEN',
      payload: { user: removeCircularRefs(user) }
    });
  });
  onValue(organizations$, organization => {
    store.dispatch({
      type: 'ORGANIZATIONS_UPDATE_FROM_TOKEN',
      payload: { organization: removeCircularRefs(organization) }
    });
  });
  onValue(spacesByOrganization$, spaces => {
    store.dispatch({
      type: 'SPACES_BY_ORG_UPDATE_FROM_TOKEN',
      payload: { spaces: removeCircularRefs(spaces) }
    });
  });
}

export default store;
