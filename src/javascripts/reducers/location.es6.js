import {
  set,
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

export default (state = null, { type, payload }) => {
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
    default:
      return state;
  }
};
