import { combineReducers } from 'redux';

import * as SpaceWizardReducers from 'components/shared/space-wizard/store/reducers';
import * as RecordsResourceUsageReducers from 'components/RecordsResourceUsage/store/reducers';
import ResourcesReducer from 'ReduxAppActions/resources/reducers';

export default combineReducers({
  spaceWizard: combineReducers(SpaceWizardReducers),
  recordsResourceUsage: combineReducers(RecordsResourceUsageReducers),
  resources: ResourcesReducer
});
