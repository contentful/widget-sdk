import moment from 'moment';
import { assign } from 'utils/Collections';
import { getContentTypeById, buildFilterFieldByQueryKey } from './Filters';
import { Operator } from './Operators';

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

export function buildQuery ({
  contentTypes,
  filterParams: { contentTypeId, searchFilters = [], searchText = '' }
}) {
  let query = searchFilters.reduce((query, [queryKey, operator, value]) => {
    const fieldInfo = buildFilterFieldByQueryKey(
      getContentTypeById(contentTypes, contentTypeId),
      queryKey
    );

    if (queryKey === '__status') {
      query = applyStatus(query, value);
    } else if (fieldInfo.type === 'Date') {
      query = applyDate(query, [queryKey, operator, value]);
    } else {
      query = applyGenericValue(query, [queryKey, operator, value]);
    }
    return query;
  }, {});

  query = applyContentType(query, contentTypeId);
  query = applySearchText(query, searchText);
  return query;
}

function applyGenericValue (query, [queryKey, operator, value]) {
  if (typeof operator === 'string' && value) {
    operator = operator.length > 0 ? `[${operator}]` : '';
    return assign(query, {
      [queryKey + operator]: value
    });
  }
}

function applyDate (query, [queryKey, operator, value]) {
  const date = moment(value, moment.ISO_8601);

  if (!date.isValid()) {
    return query;
  }


  if (operator === Operator.EQUALS) {
    query = applyGenericValue(query, [
      queryKey,
      Operator.GTE,
      date.startOf('day').toISOString()
    ]);
    query = applyGenericValue(query, [
      queryKey,
      Operator.LTE,
      date.endOf('day').toISOString()
    ]);
  } else if (operator === Operator.LT) {
    query = applyGenericValue(query, [
      queryKey,
      Operator.LT,
      date.startOf('day').toISOString()
    ]);
  } else if (operator === Operator.LTE) {
    query = applyGenericValue(query, [
      queryKey,
      Operator.LTE,
      date.endOf('day').toISOString()
    ]);
  } else if (operator === Operator.GT) {
    query = applyGenericValue(query, [
      queryKey,
      Operator.GT,
      date.endOf('day').toISOString()
    ]);
  } else if (operator === Operator.GTE) {
    query = applyGenericValue(query, [
      queryKey,
      Operator.GTE,
      date.startOf('day').toISOString()
    ]);
  } else {
    query = applyGenericValue(query, [queryKey, operator, date.toISOString()]);
  }

  return query;
}

function applyContentType (query, contentTypeId) {
  if (contentTypeId) {
    return assign(query, { content_type: contentTypeId });
  }
  return query;
}

function applySearchText (query, searchText) {
  searchText = searchText.trim();
  if (searchText) {
    return assign(query, { query: searchText });
  }
  return query;
}

function applyStatus (query, status) {
  if (status === 'published') {
    return assign(query, {
      'sys.publishedAt[exists]': 'true',
      'sys.archivedAt[exists]': 'false'
    });
  } else if (status === 'draft') {
    return assign(query, {
      'sys.publishedAt[exists]': 'false',
      'sys.archivedAt[exists]': 'false'
    });
  } else if (status === 'changed') {
    return assign(query, {
      'sys.publishedAt[exists]': 'true',
      'sys.archivedAt[exists]': 'false',
      changed: 'true'
    });
  } else if (status === 'archived') {
    return assign(query, {
      'sys.archivedAt[exists]': 'true'
    });
  } else if (status === '' || status === null) {
    return query;
  } else {
    throw new Error(`Unknown status value ${status}`);
  }
}
