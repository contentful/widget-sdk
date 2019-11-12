import combineReducers from './combineReducers';

import sso from './sso';
import spaceWizard from './spaceWizard';
import resources from './resources';
import token from './token';
import location from './location';
import datasets from './datasets/index';
import optimistic from './optimistic';
import deleted from './deleted';
import access from './access';

// the redux dev tools are highly recommended to inspect the state created by these reducers
// and how they react to actions
export default combineReducers({
  location,
  resources,
  spaceWizard,
  sso,
  token,
  datasets,
  optimistic,
  deleted,
  access
});
