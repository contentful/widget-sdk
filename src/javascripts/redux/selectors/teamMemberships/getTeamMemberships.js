import { flow, get } from 'lodash/fp';

import { TEAM_MEMBERSHIPS } from 'redux/datasets';

import { getDatasets } from '../datasets';

/**
 * @description
 * Returns all team memberships for all teams keyed by their id
 *
 * Depends on data fetching via 'redux/routes.js'.
 *
 * @return {Object}
 */
export default flow(getDatasets, get(TEAM_MEMBERSHIPS));
