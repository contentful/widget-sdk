import { flow, get, concat, orderBy, groupBy, mapValues } from 'lodash/fp';
import { getDatasets } from './datasets.es6';
import { TEAM_MEMBERSHIPS } from '../datasets.es6';
import { getCurrentTeam } from './teams.es6';
import getOptimistic from 'redux/selectors/getOptimistic.es6';

export const getTeamMemberships = flow(
  getDatasets,
  get(TEAM_MEMBERSHIPS)
);

export const getMembershipsByTeam = flow(
  getTeamMemberships,
  // get values from object...
  Object.values,
  // ... and group them by the team id instead
  groupBy('sys.team.sys.id')
);

export const getMemberCountsByTeam = flow(
  getMembershipsByTeam,
  // replace all membership of a team (which are values in this map) with cound of members
  mapValues(get('length'))
);

// Guide about flows: https://contentful.atlassian.net/wiki/spaces/BH/pages/1279721792
export const getCurrentTeamMembershipList = state => {
  const currentTeamId = getCurrentTeam(state);
  return flow(
    getMembershipsByTeam,
    // get memberships of currently active team (e.g. containg in url)
    get(currentTeamId),
    // order by first and last name, in that priority
    orderBy(['sys.user.firstName', 'sys.user.lastName'], ['asc', 'asc']),
    // optimistic membership placeholders don't have a name...
    // ...so add them after sorting at the top
    concat(getOptimistic(state)[TEAM_MEMBERSHIPS] || [])
  )(state);
};
