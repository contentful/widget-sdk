import { get, mergeWith, keyBy } from 'lodash';
import { update, concat } from 'lodash/fp';
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
    case 'TEAM_PERSISTED': {
      return update([orgId, 'teams'], concat(payload.newTeam), state);
    }
  }
  return state;
};
