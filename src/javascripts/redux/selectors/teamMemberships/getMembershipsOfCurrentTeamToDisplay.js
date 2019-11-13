import { flow, orderBy, concat } from 'lodash/fp';
import { TEAM_MEMBERSHIPS } from 'redux/datasets';

import getOptimistic from '../getOptimistic';

import getMembershipsOfCurrentTeam from './getMembershipsOfCurrentTeam';

/**
 * @description
 * Returns list of memberships of the current team, sorted and including optimistic placeholders
 *
 * Gets current team from url.
 * Depends on data fetching via 'redux/routes.js'.
 *
 * Technical sidenote:
 * Guide about flows: https://contentful.atlassian.net/wiki/spaces/BH/pages/1279721792
 *
 * @return {Object}
 */
export default state => {
  return flow(
    getMembershipsOfCurrentTeam,
    // order by first and last name, in that priority
    orderBy(['sys.user.firstName', 'sys.user.lastName'], ['asc', 'asc']),
    // optimistic membership placeholders don't have a name...
    // ...so add them after sorting at the top
    concat(getOptimistic(state)[TEAM_MEMBERSHIPS] || [])
  )(state);
};
