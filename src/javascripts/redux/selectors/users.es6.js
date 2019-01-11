import { get, flow } from 'lodash/fp';
import { getDatasets } from './datasets.es6';
import { USERS } from '../dataSets.es6';

export const getUsers = flow(
  getDatasets,
  get(USERS)
);
