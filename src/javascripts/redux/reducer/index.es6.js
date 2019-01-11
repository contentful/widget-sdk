import combineReducers from './combineReducers.es6';

import spaceWizard from './spaceWizard.es6';
import recordsResourceUsage from './recordsResourceUsage.es6';
import resources from './resources.es6';
import statePersistence from './statePersistence.es6';
import token from './token.es6';
import location from './location.es6';
import datasets from './datasets/index.es6';
import optimistic from './optimistic.es6';

export default combineReducers({
  location,
  recordsResourceUsage,
  resources,
  spaceWizard,
  statePersistence,
  token,
  datasets,
  optimistic
});
