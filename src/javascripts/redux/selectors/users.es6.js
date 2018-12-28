import { get, flow, keyBy } from 'lodash/fp';
import getDatasets from './getDatasets.es6';

export const getUsers = flow(
  getDatasets,
  get('users'),
  keyBy('sys.id')
);
