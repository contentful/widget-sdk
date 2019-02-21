import { get, flow, keyBy } from 'lodash/fp';
import getToken from './getToken.es6';
import getOrgId from './getOrgId.es6';

// gets org role of current user in current org
export default state => {
  return flow(
    getToken,
    get('user.organizationMemberships'),
    // organize current user's org memberships by org id...
    keyBy('organization.sys.id'),
    // ...to then easily get role of current user in current org
    get([getOrgId(state), 'role'])
  )(state);
};
