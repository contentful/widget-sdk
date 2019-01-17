import { get, mergeWith, keyBy } from 'lodash';
import { update, set, omit } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { TEAMS } from 'redux/datasets.es6';

export default (state = {}, { type, meta, payload, error }, globalState) => {
  const orgId = getOrgId(globalState);
  switch (type) {
    case 'DATASET_LOADING': {
      if (!get(meta, 'pending')) {
        return update(
          orgId,
          (datasets = {}) =>
            mergeWith(datasets, payload.datasets, (_, newDataset) => keyBy(newDataset, 'sys.id')),
          state
        );
      }
      break;
    }
    case 'ADD_TO_DATASET': {
      const { dataset, item } = payload;
      return set([orgId, dataset, item.sys.id], item, state);
    }
    case 'REMOVE_FROM_DATASET': {
      if (get(meta, 'pending')) {
        const { dataset, id } = payload;
        return update([orgId, dataset], omit(id), state);
      }
      if (error) {
        const { dataset, item } = meta;
        return set([orgId, dataset, item.sys.id], item, state);
      }
      return state;
    }
    case 'EDIT_TEAM_CONFIRMED': {
      const { id, changeSet } = payload;
      return update([orgId, TEAMS, id], team => ({ ...team, ...changeSet }), state);
    }
  }
  return state;
};
