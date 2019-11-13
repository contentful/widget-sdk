import { flow, mapValues, get } from 'lodash/fp';

import getMembershipsByTeam from './getMembershipsByTeam';

/**
 * @description
 * Returns membership counts keyed by the respective team
 *
 * Depends on data fetching via 'redux/routes.js'.
 *
 * @return {Object<string, number>}
 */
export default flow(
  getMembershipsByTeam,
  // replace all membership of a team (which are values in this map) with cound of members
  mapValues(get('length'))
);
