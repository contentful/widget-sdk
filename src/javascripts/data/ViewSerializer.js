import flatten from 'flat';
import { omitBy, uniq } from 'lodash';

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
  if (serializedView.displayedFieldIds) {
    serializedView.displayedFieldIds = Array.isArray(serializedView.displayedFieldIds)
      ? serializedView.displayedFieldIds
      : [serializedView.displayedFieldIds];
    serializedView.displayedFieldIds = uniq(serializedView.displayedFieldIds);
  }

  // migrate legacy contentTypeHidden field
  if (serializedView.contentTypeHidden !== undefined) {
    if (serializedView.contentTypeHidden) {
      serializedView.displayedFieldIds = serializedView.displayedFieldIds.filter(
        (id) => id !== 'contentType'
      );
    } else {
      serializedView.displayedFieldIds = ['contentType', ...serializedView.displayedFieldIds];
    }
    delete serializedView.contentTypeHidden;
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
  if (view.order && typeof view.order === 'string') {
    // `order` was previously defined in the format `order=-sys.createdAt`,
    // it is migrated to an object containing the direction and fieldId
    const [, directionChar, fieldId] = view.order.match(/^([+-]?)sys\.(\w+)$/i) || [];
    if (!fieldId) {
      delete view.order;
    } else {
      const direction = directionChar === '-' ? 'descending' : 'ascending';
      view.order = { direction, fieldId };
    }
  }
  if (view.filters) {
    view.searchFilters = view.filters.map(({ key, op, val }) => {
      return [key || '', op || '', val || ''];
    });
    delete view.filters;
  } else if (!view.searchTerm) {
    view.searchFilters = [];
  }
  if (view.displayedFieldIds) {
    view.displayedFieldIds = Array.isArray(view.displayedFieldIds)
      ? view.displayedFieldIds
      : [view.displayedFieldIds];
  }

  // migrate legacy contentTypeHidden field
  if (view.contentTypeHidden !== undefined) {
    const contentTypeHidden = view.contentTypeHidden.toString() !== 'false';
    view.displayedFieldIds = view.displayedFieldIds.filter((id) => id !== 'contentType');
    if (!contentTypeHidden) {
      view.displayedFieldIds = ['contentType', ...view.displayedFieldIds];
    }
    delete view.contentTypeHidden;
  }

  return view;
}

function isNoValue(value) {
  return value === undefined || value === null || value === '';
}
