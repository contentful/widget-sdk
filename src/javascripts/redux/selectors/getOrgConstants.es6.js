import { get } from 'lodash';

import getOrgId from './getOrgId.es6';

export const getOrgConstants = (state, { orgId: orgIdOverwrite }) => {
  const orgId = orgIdOverwrite || getOrgId(state);
  return get(state, ['orgConstants', orgId]);
};
