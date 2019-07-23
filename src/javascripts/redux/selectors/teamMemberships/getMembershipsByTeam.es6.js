import { flow, defaultTo, groupBy } from 'lodash/fp';
import { createSelector } from 'reselect';

import getTeamMemberships from './getTeamMemberships.es6';

/**
 * @description
 * Returns all team memberships grouped by their respective team
 *
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * @return {Object}
 */
export default createSelector(
  getTeamMemberships,
  flow(
    defaultTo({}),
    // get values from object...
    Object.values,
    // ... and group them by the team id instead
    groupBy('sys.team.sys.id')
  )
);
