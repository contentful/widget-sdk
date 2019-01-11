import { get, set } from 'lodash/fp';
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
  }
};
