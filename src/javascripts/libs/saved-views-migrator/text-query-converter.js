const { reduce, flatten } = require('lodash');
const { parseTextQuery, cmaQueryBuilderForField } = require('./query-builder');
const helpers = require('./helpers');
const DATE_SYS_FIELDS = ['updatedAt', 'createdAt', 'publishedAt', 'firstPublishedAt'];

// Matches an API key and an optional operator, e.g. `fields.title[match]`.
// In case of a match $1 is the key and $2 will be empty or the operator.
const API_KEY_AND_OPERATOR_REGEX = /^(.+?)(?:\[(.+)\])?$/;

module.exports.textQueryToUISearch = textQueryToUISearch;

const DATE_OPERATORS = {
  '<': 'lt',
  '<=': 'lte',
  '>': 'gt',
  '>=': 'gte'
  // '==', '=' and ':' default to ''
};

/**
 * Creates a search ui state object from a legacy text query (`searchTerm`).
 *
 * @param {ContentType?} contentType
 * @param {string} textQuery Legacy text query.
 * @param {function} Function Promise<User[]>
 * @returns {Promise<object>}
 */
function textQueryToUISearch(contentType, textQuery, getAllUsers) {
  const { filters, queryText = '' } = parseTextQuery(textQuery);
  const result = { searchText: queryText };

  if (contentType) {
    result.contentTypeId = contentType.sys.id;
  }

  const searchFilters = filters.map(filter => {
    return convertFilter(contentType, getAllUsers, filter);
  });

  return Promise.all(searchFilters).then(searchFilters => {
    result.searchFilters = flatten(searchFilters);
    return result;
  });
}

function convertFilter(contentType, getAllUsers, filter) {
  const [key, operator, value] = filter;
  const cmaQueryBuilder = cmaQueryBuilderForField(key, contentType, getAllUsers);

  if (key === 'status') {
    return [['__status', '', value]];
  } else if (isDateField(key, cmaQueryBuilder.context)) {
    return convertDateFilter(cmaQueryBuilder.context, filter);
  } else {
    return cmaQueryBuilder.build(operator, value).then(convertCMAQuery);
  }
}

function convertCMAQuery(cmaQuery) {
  return reduce(
    cmaQuery,
    (uiSearchFilters, value, keyAndOperator) => {
      const match = keyAndOperator.match(API_KEY_AND_OPERATOR_REGEX);
      if (match) {
        const field = match[1];
        const operator = match[2] || '';
        value = typeof value === 'string' ? value : value.toString();
        uiSearchFilters.push([field, operator, value]);
      }
      return uiSearchFilters;
    },
    []
  );
}

function convertDateFilter(context, [key, operator, value]) {
  if (helpers.isRelativeDate(value)) {
    return [];
  }

  const dateMatch = value.match(/^\d{4}-\d\d-\d\d/);
  const date = dateMatch && dateMatch[0];
  const prefix = isSysDateField(key) ? 'sys' : 'fields';
  const apiKey = context.apiName || key;
  return [[`${prefix}.${apiKey}`, uiSearchOperator(operator), date]];
}

function isSysDateField(fieldName) {
  return DATE_SYS_FIELDS.indexOf(fieldName) > -1;
}

function isDateField(fieldName, context) {
  return isSysDateField(fieldName) || context.type === 'Date';
}

function uiSearchOperator(operator) {
  return DATE_OPERATORS[operator] || '';
}
