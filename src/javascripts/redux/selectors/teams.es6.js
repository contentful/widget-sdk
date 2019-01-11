import { get, flow, sortBy, toLower } from 'lodash/fp';
import { getPath } from './location.es6';
import { getDatasets } from './datasets.es6';
import ROUTES from '../routes.es6';
import { TEAMS } from '../dataSets.es6';
import getOptimistic from './getOptimistic.es6';

export const getTeams = flow(
  getDatasets,
  get(TEAMS)
);

export const getTeamListWithOptimistic = state => {
  const persistedTeams = get(TEAMS, getDatasets(state)) || [];
  return sortBy(
    flow(
      get('name'),
      toLower
    ),
    Object.values(persistedTeams).concat(get(TEAMS, getOptimistic(state)) || [])
  );
};

export const getCurrentTeam = flow(
  getPath,
  ROUTES.organization.children.teams.children.team.test,
  get('teamId')
);
