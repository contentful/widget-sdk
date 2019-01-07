import { get, mergeWith, keyBy } from 'lodash';
import { update, set, omit } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId.es6';

export default (state = {}, { type, meta, payload }, globalState) => {
  const orgId = getOrgId(globalState);
  switch (type) {
    case 'DATASET_LOADING': {
      if (!get(meta, 'pending')) {
        return update(
          orgId,
          (datasets = {}) =>
            mergeWith(datasets, payload.datasets, (dataset, newDataset) => ({
              ...dataset,
              ...keyBy(newDataset, 'sys.id')
            })),
          state
        );
      }
      break;
    }
    case 'ADD_TO_DATASET': {
      const { dataset, item } = payload;
      return set([orgId, dataset, item.sys.id], item, state);
    }
    case 'REMOVE_FROM_DATASET_CONFIRMED': {
      const { dataset, id } = payload;
      return update([orgId, dataset], omit(id), state);
    }
  }
  return state;
};
