import { get, flow, sortBy } from 'lodash/fp';
import { getPath } from './location.es6';
import getDatasets from './getDatasets.es6';
import ROUTES from '../routes.es6';

export const getTeams = flow(
  getDatasets,
  get('teams')
);

export const getTeamListWithOptimistic = state => {
  const persistedTeams = get('teams', getDatasets(state)) || [];
  return sortBy('name', Object.values(persistedTeams).concat(get('optimistic.teams', state) || []));
};

export const getCurrentTeam = flow(
  getPath,
  ROUTES.organization.children.teams.children.team.test,
  get('teamId')
);
