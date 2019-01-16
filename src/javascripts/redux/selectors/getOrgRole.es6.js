import { get, flow, keyBy } from 'lodash/fp';
import getToken from './getToken.es6';
import getOrgId from './getOrgId.es6';

export default state => {
  return flow(
    getToken,
    get('user.organizationMemberships'),
    keyBy('organization.sys.id'),
    get([getOrgId(state), 'role'])
  )(state);
};
