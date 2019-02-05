import { get, set, zipObject, update, merge } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId.es6';

// this substate currently has pending operations state and
// timestamps when datasets have last been updated
export default (state = {}, { type, payload, meta, error }, globalState) => {
  const orgId = getOrgId(globalState);
  switch (type) {
    case 'REMOVE_FROM_DATASET': {
      if (get('pending', meta)) {
        // set a flag if an item is currently removed from dataset
        // is used to prevent requesting this data from the server and overwriting the locally removed item
        return set([orgId, payload.dataset, 'pending'], true, state);
      }
      return set([orgId, error ? meta.dataset : payload.dataset, 'pending'], false, state);
    }
    case 'DATASET_LOADING': {
      if (!get('pending', meta)) {
        const { datasets } = payload;
        const datasetKeys = Object.keys(datasets);
        // create an object with the current timestamp for the given datasets
        // this is used to limit how often data is requested from the server
        const timestampsForDatasets = zipObject(
          datasetKeys,
          datasetKeys.map(() => ({ fetched: Date.now() }))
        );
        return update(
          orgId,
          currentDatasets => merge(currentDatasets, timestampsForDatasets),
          state
        );
      }
      break;
    }
  }
  return state;
};
