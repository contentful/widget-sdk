import { flow, defaultTo, groupBy } from 'lodash/fp';

import getTeamMemberships from './getTeamMemberships.es6';

/**
 * @description
 * Returns all team memberships grouped by their respective team
 *
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * @return {Object}
 */
export default flow(
  getTeamMemberships,
  defaultTo({}),
  // get values from object...
  Object.values,
  // ... and group them by the team id instead
  groupBy('sys.team.sys.id')
);
