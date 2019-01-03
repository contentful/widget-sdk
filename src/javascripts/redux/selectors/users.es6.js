import { get, flow } from 'lodash/fp';
import getDatasets from './getDatasets.es6';

export const getUsers = flow(
  getDatasets,
  get('users')
);
