import { combineReducers } from 'redux';

import * as SpaceWizardReducers from 'components/shared/space-wizard/store/reducers.es6';
import * as RecordsResourceUsageReducers from 'components/RecordsResourceUsage/store/reducers.es6';
import ResourcesReducer from 'ReduxAppActions/resources/reducers.es6';
import StatePersistenceReducer from 'ReduxAppActions/statePersistence/reducer.es6';

export default combineReducers({
  spaceWizard: combineReducers(SpaceWizardReducers),
  recordsResourceUsage: combineReducers(RecordsResourceUsageReducers),
  resources: ResourcesReducer,
  statePersistence: StatePersistenceReducer
});
