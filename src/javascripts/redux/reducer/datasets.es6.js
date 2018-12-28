import { get } from 'lodash';
import { merge } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId.es6';

export default (state = {}, { type, meta, payload }, globalState) => {
  if (type === 'DATASET_LOADING' && !get(meta, 'pending')) {
    const orgId = getOrgId(globalState);
    return merge(state, { [orgId]: payload.datasets });
  }
  return state;
};
