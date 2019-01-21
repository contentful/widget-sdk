import { get, set, zipObject, update, merge } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId.es6';

export default (state = {}, { type, payload, meta, error }, globalState) => {
  const orgId = getOrgId(globalState);
  switch (type) {
    case 'REMOVE_FROM_DATASET': {
      if (get('pending', meta)) {
        return set([orgId, payload.dataset, 'pending'], true, state);
      }
      return set([orgId, error ? meta.dataset : payload.dataset, 'pending'], false, state);
    }
    case 'DATASET_LOADING': {
      if (!get('pending', meta)) {
        const { datasets } = payload;
        const datasetKeys = Object.keys(datasets);
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
