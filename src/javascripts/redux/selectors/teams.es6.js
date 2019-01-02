import { get, flow, keyBy, sortBy } from 'lodash/fp';
import { getPath } from './location.es6';
import getDatasets from './getDatasets.es6';
import ROUTES from '../routes.es6';

export const getTeams = flow(
  getDatasets,
  get('teams'),
  keyBy('sys.id')
);

export const getTeamListWithOptimistic = state => {
  const persistedTeams = get('teams', getDatasets(state)) || [];
  return sortBy('name', persistedTeams.concat(get('optimistic.teams', state) || []));
};

export const getTeamId = flow(
  getPath,
  ROUTES.organization.children.teams.children.team.test,
  get('teamId')
);
