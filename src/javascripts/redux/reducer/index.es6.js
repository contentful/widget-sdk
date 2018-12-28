import { set } from 'lodash/fp';

import spaceWizard from './spaceWizard.es6';
import recordsResourceUsage from './recordsResourceUsage.es6';
import resources from './resources.es6';
import statePersistence from './statePersistence.es6';
import token from './token.es6';
import location from './location.es6';
import datasets from './datasets.es6';

const combineReducers = reducerMap => (state = {}, action) =>
  Object.keys(reducerMap).reduce(
    (newState, reducerKey) =>
      set(reducerKey, reducerMap[reducerKey](state[reducerKey], action, state), newState),
    {}
  );

export default combineReducers({
  location,
  recordsResourceUsage,
  resources,
  spaceWizard,
  statePersistence,
  token,
  datasets
});
