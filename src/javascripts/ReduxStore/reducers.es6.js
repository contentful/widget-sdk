import { combineReducers } from 'redux';

import * as SpaceWizardReducers from 'components/shared/space-wizard/store/reducers';
import * as RecordsResourceUsageReducers from 'components/shared/RecordsResourceUsage/store/reducers';

export default combineReducers({
  spaceWizard: combineReducers(SpaceWizardReducers),
  recordsResourceUsage: combineReducers(RecordsResourceUsageReducers)
});
