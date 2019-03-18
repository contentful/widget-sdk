import { get, flow, defaultTo } from 'lodash/fp';
import { getDatasets } from './datasets.es6';
import { USERS } from '../datasets.es6';

export const getUsers = flow(
  getDatasets,
  get(USERS),
  defaultTo({})
);

export const getCurrentUser = get('token.user');
