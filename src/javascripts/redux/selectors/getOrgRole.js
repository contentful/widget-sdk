import { get, flow, keyBy } from 'lodash/fp';
import { createSelector } from 'reselect';

import getToken from './getToken';
import getOrgId from './getOrgId';

// gets org role of current user in current org
export default createSelector(
  getToken,
  (state, props) => get('orgId', props) || getOrgId(state),
  (token, orgId) =>
    flow(
      get('user.organizationMemberships'),
      // organize current user's org memberships by org id...
      keyBy('organization.sys.id'),
      // ...to then easily get role of current user in current org
      get([orgId, 'role'])
    )(token)
);
