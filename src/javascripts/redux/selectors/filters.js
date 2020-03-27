import { flow, get, defaultTo } from 'lodash/fp';
import qs from 'qs';

import { getQuery } from './location';

const getQueryParameters = flow(getQuery, (query) => query.slice(1), qs.parse);

// get filters for the current view from the url query parameters
export const getFilters = flow(getQueryParameters, get('filters'), defaultTo({}));

export const getSearchTerm = flow(getQueryParameters, get('searchTerm'), defaultTo(''));
