import { user$, organizations$, spacesByOrganization$ } from '../services/TokenStore.es6';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { onValue } from 'utils/kefir.es6';
import fclone from 'fclone';

import middlewares from './middlewares/index.es6';
import reducer from './reducer/index.es6';
import * as actionCreators from 'redux/actions/token/actionCreators.es6';
import { fetchCurrentOrgConstants } from 'redux/actions/orgConstants/actionCreators.es6';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(reducer, composeEnhancers(applyMiddleware(thunk, ...middlewares)));

if (user$ && organizations$ && spacesByOrganization$) {
  onValue(user$, user => store.dispatch(actionCreators.updateUserFromToken(fclone(user))));
  onValue(organizations$, organization =>
    store.dispatch(actionCreators.updateOrganizationsFromToken(fclone(organization)))
  );
  onValue(spacesByOrganization$, spaces => {
    store.dispatch(actionCreators.updateSpacesByOrgIdFromToken(fclone(spaces)));
    // we need the spaces to be present to figure out what
    // is the current org in case the current page is a space
    store.dispatch(fetchCurrentOrgConstants());
  });
}

export default store;
