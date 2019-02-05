import { set, get, update, map, keyBy, flow, mapValues, omitBy, isEmpty, omitAll } from 'lodash/fp';
import qs from 'qs';
import getOrgId from '../selectors/getOrgId.es6';
import ROUTES from '../routes.es6';
import { TEAMS } from '../datasets.es6';

// Guide about flows: https://contentful.atlassian.net/wiki/spaces/BH/pages/1279721792

// note that 'filters' include the order
const filtersToObject = flow(
  map('filter'), // get 'filter' property for all filters
  keyBy('key'), // make a map for the query
  mapValues('value'), // discard everything except for the value from the filters
  omitBy(isEmpty) // discard empty filters
);

// update the query parameters as object
const updateLocationQuery = updater =>
  update(
    'search',
    flow(
      query => query.slice(1), // remove leading '?'
      qs.parse, // parse query string into object
      updater, // update query object with given function
      qs.stringify, // create query string from query object
      query => (query === '' ? '' : `?${query}`) // if query is non-empty, add leading '?'
    )
  );

// Action structure follows this guideline: https://github.com/redux-utilities/flux-standard-actions
export default (state = null, { type, payload, meta }, globalState) => {
  switch (type) {
    case 'LOCATION_CHANGED':
      return payload.location;
    case 'RESET_FILTERS': {
      // remove filters from query
      return updateLocationQuery(omitAll(['filters', 'searchTerm']))(state);
    }
    case 'CHANGE_FILTERS': {
      return updateLocationQuery(set('filters', filtersToObject(payload.newFilters)))(state);
    }
    case 'UPDATE_SEARCH_TERM': {
      return updateLocationQuery(set('searchTerm', payload.newSearchTerm))(state);
    }
    // remove item from the application state while the server request is still pending
    case 'REMOVE_FROM_DATASET': {
      if (get('pending', meta) && get('dataset', payload) === TEAMS) {
        return set(
          'pathname',
          ROUTES.organization.children.teams.build({ orgId: getOrgId(globalState) }),
          state
        );
      }
      return state;
    }
    default:
      return state;
  }
};
