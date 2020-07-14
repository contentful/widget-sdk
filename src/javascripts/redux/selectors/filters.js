import { flow, get, defaultTo } from 'lodash/fp';
import qs from 'qs';

import { getQuery } from './location';

const getQueryParameters = flow(getQuery, (query) => query.slice(1), qs.parse);

export const getSearchTerm = flow(getQueryParameters, get('searchTerm'), defaultTo(''));
