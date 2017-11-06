import flatten from 'libs/flat';
import {omitBy} from 'lodash';

export function serialize (viewObject) {
  const view = omitBy(viewObject, isNoValue);

  if (view.searchFilters) {
    const filters = view.searchFilters.map(([key, op, val]) => {
      const filter = {key, op, val};
      return omitBy(filter, isNoValue);
    });
    if (filters.length) {
      view.filters = flatten(filters, {safe: false});
    }
    delete view.searchFilters;
  }
  return flatten(view, {safe: true});
}

export function unserialize (serializedView) {
  const view = flatten.unflatten(serializedView, {safe: true});

  if (view.filters || view.searchText !== undefined) {
    delete view.searchTerm; // Doesn't make sense to have both formats - ignore.
  }
  if (view.filters) {
    view.searchFilters = view.filters.map(({key, op, val}) => {
      return [key || '', op || '', val || ''];
    });
    delete view.filters;
  } else if (!view.searchTerm) { // TODO: Remove condition after migrating Assets.
    view.searchFilters = [];
  }
  return view;
}

function isNoValue (value) {
  return value === undefined || value === null || value === '';
}
