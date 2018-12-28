import { get, flow, keyBy } from 'lodash/fp';
import { getPath } from './location.es6';
import getDatasets from './getDatasets.es6';
import ROUTES from '../routes.es6';

export const getTeams = flow(
  getDatasets,
  get('teams'),
  keyBy('sys.id')
);

export const getTeamId = flow(
  getPath,
  ROUTES.organization.children.teams.children.team.test,
  get('teamId')
);
