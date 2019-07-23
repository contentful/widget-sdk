import { flow, get } from 'lodash/fp';

import { TEAM_MEMBERSHIPS } from 'redux/datasets.es6';

import { getDatasets } from '../datasets.es6';

/**
 * @description
 * Returns all team memberships for all teams keyed by their id
 *
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * @return {Object}
 */
export default flow(
  getDatasets,
  get(TEAM_MEMBERSHIPS)
);
