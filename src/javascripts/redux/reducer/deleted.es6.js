import { get, set, omit, update } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getDatasets } from '../selectors/datasets.es6';

// This reducers saves an optimistically deleted item for error recovery
// Action structure follows these guidelines: https://github.com/redux-utilities/flux-standard-actions
export default (state, { type, payload, meta, error }, globalState) => {
  switch (type) {
    case 'REMOVE_FROM_DATASET': {
      const orgId = getOrgId(globalState);
      const id = error ? meta.id : payload.id;
      const dataset = error ? meta.dataset : payload.dataset;
      // if an item removal is pending...
      if (get('pending', meta)) {
        // get the item
        // it will not be deleted in the global state
        const item = getDatasets(globalState)[dataset][id];
        // save it in the sub state of this reducer
        return set([orgId, dataset, id], item, state);
      }
      // clear the deleted item after request confirmed or errored
      // this reducer doesn't do the restoration of a deleted
      return update([orgId, dataset], omit(id), state);
    }
  }
  return state;
};
