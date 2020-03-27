import { user$, organizations$, spacesByOrganization$ } from '../services/TokenStore';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { onValue } from 'utils/kefir';
import fclone from 'fclone';

import middlewares from './middlewares';
import reducer from './reducer';
import * as actionCreators from 'redux/actions/token/actionCreators';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(reducer, composeEnhancers(applyMiddleware(thunk, ...middlewares)));

if (user$ && organizations$ && spacesByOrganization$) {
  onValue(user$, (user) => store.dispatch(actionCreators.updateUserFromToken(fclone(user))));
  onValue(organizations$, (organization) =>
    store.dispatch(actionCreators.updateOrganizationsFromToken(fclone(organization)))
  );
  onValue(spacesByOrganization$, (spaces) => {
    store.dispatch(actionCreators.updateSpacesByOrgIdFromToken(fclone(spaces)));
  });
}

export default store;
