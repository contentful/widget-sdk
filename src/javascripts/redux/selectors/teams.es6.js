import { get, flow, sortBy } from 'lodash/fp';

export const getAllTeams = flow(
  get('datasets.teams'),
  sortBy('name')
);
