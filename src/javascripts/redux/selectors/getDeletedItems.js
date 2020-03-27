import { get } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId';

// get optimistically deleted items
// used to restore them in case of a failed server request
export default (state) => {
  const orgId = getOrgId(state);
  return get(['deleted', orgId], state);
};
