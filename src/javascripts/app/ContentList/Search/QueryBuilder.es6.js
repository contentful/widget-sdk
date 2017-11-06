import { assign } from 'utils/Collections';

/**
 * Takes an object representing the `Search` component's public state object and
 * constructs a query object for the Content Managment API.
 *
 * Handles the special `__status` key that translates to complicated
 * queries on `sys` fields.
 *
 * @param {String?} options.contentTypeId
 * @param {Array?} options.searchFilters A list of [filter, operator, value] triples.
 * @param {String?} options.searchText
 *
 * TODO: Write tests.
 */
export function buildQuery ({contentTypeId, searchFilters = [], searchText}) {
  let queryObj = searchFilters.reduce((obj, [key, op, value]) => {
    if (key === '__status') {
      if (value === 'published') {
        obj['sys.publishedAt[exists]'] = 'true';
        obj['sys.archivedAt[exists]'] = 'false';
      } else if (value === 'draft') {
        obj['sys.publishedAt[exists]'] = 'false';
        obj['sys.archivedAt[exists]'] = 'false';
      } else if (value === 'changed') {
        obj['sys.publishedAt[exists]'] = 'true';
        obj['sys.archivedAt[exists]'] = 'false';
        obj['changed'] = 'true';
      } else if (value === 'archived') {
        obj['sys.archivedAt[exists]'] = 'true';
      } else if (value === '' || value === null) {
        // Search for anything
      } else {
        throw new Error(`Unknown status value ${value}`);
      }
    } else {
      if (typeof op === 'string' && value) {
        op = op.length > 0 ? `[${op}]` : '';
        obj[key + op] = value;
      }
    }
    return obj;
  }, {});

  if (contentTypeId) {
    queryObj.content_type = contentTypeId;
  }

  searchText = searchText.trim();
  if (searchText) {
    queryObj = assign(queryObj, { query: searchText });
  }

  return queryObj;
}
