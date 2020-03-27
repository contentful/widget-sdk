const { parseTextQuery, cmaQueryBuilderForField } = require('./query-builder');
const { RELATIVE_DATE_REGEX } = require('./helpers');
const DATE_SYS_FIELDS = ['updatedAt', 'createdAt', 'publishedAt', 'firstPublishedAt'];

// Matches an API key and an optional operator, e.g. `fields.title[match]`.
// In case of a match $1 is the key and $2 will be empty or the operator.
const API_KEY_AND_OPERATOR_REGEX = /^(.+?)(?:\[(.+)\])?$/;

const DATE_OPERATORS = {
  '<': 'lt',
  '<=': 'lte',
  '>': 'gt',
  '>=': 'gte',
  // '==', '=' and ':' default to ''
};

module.exports = { textQueryToUISearch };

/**
 * Creates a search UI state object from a legacy text query (`searchTerm`).
 */
function textQueryToUISearch(contentType, textQuery) {
  const { filters, queryText = '' } = parseTextQuery(textQuery);
  const result = { searchText: queryText };

  if (contentType) {
    result.contentTypeId = contentType.sys.id;
  }

  result.searchFilters = filters.reduce((acc, filter) => {
    const converted = convertFilter(contentType, filter);
    return Array.isArray(converted) ? [...acc, converted] : acc;
  }, []);

  return result;
}

function convertFilter(contentType, filter) {
  const [key, operator, value] = filter;
  const cmaQueryBuilder = cmaQueryBuilderForField(key, contentType);

  if (key === 'status') {
    return ['__status', '', value];
  } else if (isDateField(key, cmaQueryBuilder.context)) {
    return convertDateFilter(cmaQueryBuilder.context, filter);
  } else {
    const cmaQuery = cmaQueryBuilder.build(operator, value);
    return convertCMAQuery(cmaQuery);
  }
}

function convertCMAQuery(cmaQuery) {
  const keyAndOperator = Object.keys(cmaQuery)[0];
  const value = cmaQuery[keyAndOperator];
  const match = keyAndOperator.match(API_KEY_AND_OPERATOR_REGEX);

  if (match) {
    return [match[1], match[2] || '', typeof value === 'string' ? value : value.toString()];
  }
}

function convertDateFilter(context, [key, operator, value]) {
  if (!RELATIVE_DATE_REGEX.test(value)) {
    const dateMatch = value.match(/^\d{4}-\d\d-\d\d/);
    const date = dateMatch && dateMatch[0];
    const prefix = isSysDateField(key) ? 'sys' : 'fields';
    const apiKey = context.apiName || key;
    return [`${prefix}.${apiKey}`, uiSearchOperator(operator), date];
  }
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
