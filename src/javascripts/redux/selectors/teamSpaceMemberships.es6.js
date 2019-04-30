import { flow, get, concat, groupBy, defaultTo } from 'lodash/fp';
import { getDatasets } from './datasets.es6';
import { TEAM_SPACE_MEMBERSHIPS } from '../datasets.es6';
import { getCurrentTeam } from './teams.es6';
import getOptimistic from './getOptimistic.es6';

/**
 * @description
 * Return map of all team space memberships in current org, keyed by id
 *
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * @return {Object}
 */
export const getTeamSpaceMemberships = flow(
  getDatasets,
  get(TEAM_SPACE_MEMBERSHIPS)
);

const getSpaceName = membership => get('sys.space.name', membership) || '';

const sortBySpaceName = memberships =>
  memberships.sort((a, b) => getSpaceName(a).localeCompare(getSpaceName(b)));

/**
 * @description
 * Return map of all team space memberships, grouped by team id
 *
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * @return {Object}
 */
export const getSpaceMembershipsByTeam = flow(
  getTeamSpaceMemberships,
  defaultTo({}),
  // get values from object...
  Object.values,
  // ... and group them by the team id instead
  groupBy('sys.team.sys.id')
);

/**
 * @description
 * Returns list of space memberships of the current team, sorted and including optimistic placeholders
 *
 * Gets current team from url.
 * Depends on data fetching via 'redux/routes.es6.js'.
 *
 * Technical sidenote:
 * Guide about flows: https://contentful.atlassian.net/wiki/spaces/BH/pages/1279721792
 *
 * @return {Array}
 */
export const getTeamSpaceMembershipsOfCurrentTeamToDisplay = state => {
  const currentTeamId = getCurrentTeam(state);
  return flow(
    getSpaceMembershipsByTeam,
    // get team space memberships of currently active team (e.g. containing in url)
    get(currentTeamId),
    defaultTo([]),
    sortBySpaceName,
    concat(getOptimistic(state)[TEAM_SPACE_MEMBERSHIPS] || [])
  )(state);
};
