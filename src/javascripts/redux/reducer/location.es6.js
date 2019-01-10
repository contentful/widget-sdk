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
import { getPath } from '../selectors/location.es6';
import ROUTES from '../routes.es6';

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

export default (state = null, { type, payload }, globalState) => {
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
    case 'NAVIGATION_BACK': {
      const match = ROUTES.organization.children.teams.children.team.test(getPath(globalState));
      if (match !== null) {
        return set(
          'pathname',
          ROUTES.organization.children.teams.build({ orgId: match.orgId }),
          state
        );
      }
      return state;
    }
    default:
      return state;
  }
};
