import { get } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId.es6';

// get optimistically deleted items
// used to restore them in case of a server error
export default state => {
  const orgId = getOrgId(state);
  return get(['deleted', orgId], state);
};
