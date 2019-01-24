import { get } from 'lodash/fp';
import getOrgId from 'redux/selectors/getOrgId.es6';

export default state => {
  const orgId = getOrgId(state);
  return get(['deleted', orgId], state);
};
