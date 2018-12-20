import { combineReducers } from 'redux';

import spaceWizard from './spaceWizard.es6';
import recordsResourceUsage from './recordsResourceUsage.es6';
import resources from './resources.es6';
import statePersistence from './statePersistence.es6';
import token from './token.es6';
import location from './location.es6';

export default combineReducers({
  location,
  recordsResourceUsage,
  resources,
  spaceWizard,
  statePersistence,
  token
});
