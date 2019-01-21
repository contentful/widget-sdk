import { get, set, omit, update } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getDatasets } from '../selectors/datasets.es6';

export default (state, { type, payload, meta, error }, globalState) => {
  switch (type) {
    case 'REMOVE_FROM_DATASET': {
      const orgId = getOrgId(globalState);
      const id = error ? meta.id : payload.id;
      const dataset = error ? meta.dataset : payload.dataset;
      if (get('pending', meta)) {
        const item = getDatasets(globalState)[dataset][id];
        return set([orgId, dataset, id], item, state);
      }
      return update([orgId, dataset], omit(id), state);
    }
  }
  return state;
};
