import { flow, get, concat, groupBy, defaultTo } from 'lodash/fp';
import { getDatasets } from './datasets.es6';
import { TEAM_SPACE_MEMBERSHIPS } from '../datasets.es6';
import { getCurrentTeam } from './teams.es6';
import getOptimistic from 'redux/selectors/getOptimistic.es6';

export const getTeamSpaceMemberships = flow(
  getDatasets,
  get(TEAM_SPACE_MEMBERSHIPS)
);

const getSpaceName = membership => get('sys.space.name', membership) || '';

const sortBySpaceName = memberships =>
  memberships.sort((a, b) => getSpaceName(a).localeCompare(getSpaceName(b)));

export const getSpaceMembershipsByTeam = flow(
  getTeamSpaceMemberships,
  defaultTo({}),
  // get values from object...
  Object.values,
  // ... and group them by the team id instead
  groupBy('sys.team.sys.id')
);

// Guide about flows: https://contentful.atlassian.net/wiki/spaces/BH/pages/1279721792
export const getCurrentTeamSpaceMembershipList = state => {
  const currentTeamId = getCurrentTeam(state);
  return flow(
    getSpaceMembershipsByTeam,
    // get team space memberships of currently active team (e.g. containg in url)
    get(currentTeamId),
    defaultTo([]),
    sortBySpaceName,
    concat(getOptimistic(state)[TEAM_SPACE_MEMBERSHIPS] || [])
  )(state);
};
