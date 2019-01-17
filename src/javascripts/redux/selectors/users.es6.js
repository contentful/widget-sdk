import { get, flow } from 'lodash/fp';
import { getDatasets } from './datasets.es6';
import { USERS } from '../datasets.es6';

export const getUsers = flow(
  getDatasets,
  get(USERS)
);

export const getCurrentUser = flow(get('token.user'));
