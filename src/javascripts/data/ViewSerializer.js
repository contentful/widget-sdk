import flatten from 'flat';
import { omitBy } from 'lodash';

/**
 * Takes a `View` object and returns a flattened representation of it that can be
 * used for local storage and URL.
 *
 * @param {View} view
 * @returns {object} Serialized view.
 */
export function serialize(view) {
  const serializedView = omitBy(view, isNoValue);

  if (serializedView.searchFilters) {
    const filters = serializedView.searchFilters.map(([key, op, val]) => {
      const filter = { key, op, val };
      return omitBy(filter, isNoValue);
    });
    if (filters.length) {
      serializedView.filters = flatten(filters, { safe: false });
    }
    delete serializedView.searchFilters;
  }
  return flatten(serializedView, { safe: true });
}

/**
 * Takes a serialized view object as returned by `serialize()` and returns the
 * original `View` object.
 *
 * @param {object} serializedView
 * @returns {View}
 */
export function unserialize(serializedView) {
  const view = flatten.unflatten(serializedView, { safe: true });

  if (view.filters || view.searchText !== undefined) {
    // `searchTerm` is legacy text search format. Having both formats does not make
    // sense and should only happen when URL was manually edited. Prefer new format.
    delete view.searchTerm;
  }
  if (view.filters) {
    view.searchFilters = view.filters.map(({ key, op, val }) => {
      return [key || '', op || '', val || ''];
    });
    delete view.filters;
  } else if (!view.searchTerm) {
    view.searchFilters = [];
  }
  return view;
}

function isNoValue(value) {
  return value === undefined || value === null || value === '';
}
