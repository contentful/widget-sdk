import { get } from 'lodash';
import { createSelector } from 'reselect';

import getOrgId from './getOrgId.es6';

export const getOrgConstants = (state, { orgId: orgIdOverwrite }) => {
  const orgId = orgIdOverwrite || getOrgId(state);
  return get(state, ['orgConstants', orgId]);
};

export const getCurrentOrgConstants = createSelector(
  [getOrgId],
  getOrgConstants
);
