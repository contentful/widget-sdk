import { get, mergeWith, keyBy } from 'lodash';
import { update, set, omit } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { TEAM_MEMBERSHIPS, TEAMS } from '../dataSets.es6';

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
    case 'REMOVE_TEAM_MEMBERSHIP_CONFIRMED': {
      return update([orgId, TEAM_MEMBERSHIPS], omit(payload.teamMembershipId), state);
    }
    case 'REMOVE_TEAM_CONFIRMED': {
      return update([orgId, TEAMS], omit(payload.teamId), state);
    }
  }
  return state;
};
