import { get, flow, sortBy, toLower } from 'lodash/fp';
import { getPath } from './location.es6';
import { getDatasets } from './datasets.es6';
import ROUTES from '../routes.es6';
import { TEAMS } from '../datasets.es6';
import getOptimistic from './getOptimistic.es6';
import getOrgRole from './getOrgRole.es6';

export const getTeams = flow(
  getDatasets,
  get(TEAMS)
);

// Guide about flows: https://contentful.atlassian.net/wiki/spaces/BH/pages/1279721792
export const getTeamListWithOptimistic = state => {
  const persistedTeams = get(TEAMS, getDatasets(state)) || [];
  const teamListWithOptimistic = Object.values(persistedTeams).concat(
    get(TEAMS, getOptimistic(state)) || []
  );
  return sortBy(
    flow(
      get('name'),
      toLower
    ),
    teamListWithOptimistic
  );
};

export const getCurrentTeam = flow(
  getPath,
  ROUTES.organization.children.teams.children.team.test,
  get('teamId')
);

export const hasReadOnlyPermission = state => !['owner', 'admin'].includes(getOrgRole(state));
