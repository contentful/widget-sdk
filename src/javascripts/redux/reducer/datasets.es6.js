import { get } from 'lodash';
import { merge } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId.es6';

export default (state = {}, { type, meta, payload }, globalState) => {
  switch (type) {
    case 'DATASET_LOADING': {
      if (!get(meta, 'pending')) {
        const orgId = getOrgId(globalState);
        return merge(state, { [orgId]: payload.datasets });
      }
      break;
    }
  }
  return state;
};
