import { combineReducers } from 'redux';

import * as SpaceWizardReducers from 'components/shared/space-wizard/store/reducers';
import * as RecordsResourceUsageReducers from 'components/RecordsResourceUsage/store/reducers';
import ResourcesReducer from 'ReduxAppActions/resources/reducers';
import StatePersistenceReducer from 'ReduxAppActions/statePersistence/reducer';

export default combineReducers({
  spaceWizard: combineReducers(SpaceWizardReducers),
  recordsResourceUsage: combineReducers(RecordsResourceUsageReducers),
  resources: ResourcesReducer,
  statePersistence: StatePersistenceReducer
});
