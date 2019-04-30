import { flow, get, concat, orderBy, groupBy, mapValues, defaultTo } from 'lodash/fp';
import { TEAM_MEMBERSHIPS } from '../datasets.es6';

import { getDatasets } from './datasets.es6';
import { getCurrentTeam } from './teams.es6';
import getOptimistic from './getOptimistic.es6';

/**
 * @description
 * Returns all team memberships for all teams keyed by their id
 *
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * @return {Object}
 */
export const getTeamMemberships = flow(
  getDatasets,
  get(TEAM_MEMBERSHIPS)
);

/**
 * @description
 * Returns all team memberships grouped by their respective team
 *
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * @return {Object}
 */
export const getMembershipsByTeam = flow(
  getTeamMemberships,
  defaultTo({}),
  // get values from object...
  Object.values,
  // ... and group them by the team id instead
  groupBy('sys.team.sys.id')
);

/**
 * @description
 * Returns membership counts keyed by the respective team
 *
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * @return {Object<string, number>}
 */
export const getMemberCountsByTeam = flow(
  getMembershipsByTeam,
  // replace all membership of a team (which are values in this map) with cound of members
  mapValues(get('length'))
);

/**
 * @description
 * Returns list of memberships of the current team
 *
 * Gets current team from url.
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * @return {Array}
 */
export const getMembershipsOfCurrentTeam = state => {
  // get memberships of currently active team (e.g. containg in url)
  const currentTeamId = getCurrentTeam(state);
  return getMembershipsByTeam(state)[currentTeamId];
};

/**
 * @description
 * Returns list of memberships of the current team, sorted and including optimistic placeholders
 *
 * Gets current team from url.
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * Technical sidenote:
 * Guide about flows: https://contentful.atlassian.net/wiki/spaces/BH/pages/1279721792
 *
 * @return {Object}
 */
export const getMembershipsOfCurrentTeamToDisplay = state => {
  return flow(
    getMembershipsOfCurrentTeam,
    // order by first and last name, in that priority
    orderBy(['sys.user.firstName', 'sys.user.lastName'], ['asc', 'asc']),
    // optimistic membership placeholders don't have a name...
    // ...so add them after sorting at the top
    concat(getOptimistic(state)[TEAM_MEMBERSHIPS] || [])
  )(state);
};
