import combineReducers from './combineReducers.es6';

import sso from './sso.es6';
import spaceWizard from './spaceWizard.es6';
import recordsResourceUsage from './recordsResourceUsage.es6';
import resources from './resources.es6';
import statePersistence from './statePersistence.es6';
import token from './token.es6';
import location from './location.es6';
import datasets from './datasets/index.es6';
import optimistic from './optimistic.es6';
import deleted from './deleted.es6';
import access from './access.es6';
import orgsConstants from './orgsConstants.es6';

// the redux dev tools are highly recommended to inspect the state created by these reducers
// and how they react to actions
export default combineReducers({
  location,
  recordsResourceUsage,
  resources,
  spaceWizard,
  statePersistence,
  sso,
  token,
  datasets,
  optimistic,
  deleted,
  access,
  orgsConstants
});
