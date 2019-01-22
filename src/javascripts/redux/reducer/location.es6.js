import {
  set,
  get,
  update,
  map,
  keyBy,
  flow,
  mapValues,
  pickBy,
  isEmpty,
  negate,
  omitAll
} from 'lodash/fp';
import qs from 'qs';
import getOrgId from '../selectors/getOrgId.es6';
import ROUTES from '../routes.es6';
import { TEAMS } from '../datasets.es6';

const viewToObject = flow(
  map('filter'),
  keyBy('key'),
  mapValues('value'),
  pickBy(negate(isEmpty))
);

const updateLocationQuery = updater =>
  update(
    'search',
    flow(
      query => query.slice(1),
      qs.parse,
      updater,
      qs.stringify,
      query => (query === '' ? '' : `?${query}`)
    )
  );

export default (state = null, { type, payload, meta }, globalState) => {
  switch (type) {
    case 'LOCATION_CHANGED':
      return payload.location;
    case 'RESET_FILTERS': {
      return updateLocationQuery(omitAll(['filters', 'spaceTerm']))(state);
    }
    case 'CHANGE_FILTERS': {
      return updateLocationQuery(set('filters', viewToObject(payload.newFilters)))(state);
    }
    case 'UPDATE_SEARCH_TERM': {
      return updateLocationQuery(set('searchTerm', payload.newSearchTerm))(state);
    }
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
