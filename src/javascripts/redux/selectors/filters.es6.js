import { flow, get, defaultTo } from 'lodash/fp';
import qs from 'qs';

import { getQuery } from './location.es6';

const getQueryParameters = flow(
  getQuery,
  query => query.slice(1),
  qs.parse
);

export const getFilters = flow(
  getQueryParameters,
  get('filters'),
  defaultTo({})
);

export const getSearchTerm = flow(
  getQueryParameters,
  get('searchTerm'),
  defaultTo('')
);
