const { get } = require('lodash');
const { queryOperator } = require('./helpers');
const parse = require('./legacy-search-parser');
const converters = require('./converters');

const apiNameOrId = field => field.apiName || field.id;

module.exports = {
  cmaQueryBuilderForField,
  parseTextQuery
};

function parseTokens(textQuery) {
  try {
    const tokens = parse(textQuery);
    return Array.isArray(tokens) ? tokens : [];
  } catch (err) {
    return [];
  }
}

function parseTextQuery(textQuery) {
  const tokens = parseTokens(textQuery);
  const filters = getFilters(tokens);
  const queryText = getQueryText(tokens);
  return { filters, queryText };
}

// Returns a list of [key, operator, value] pairs from tokens
function getFilters(tokens) {
  return tokens
    .filter(token => {
      return token.type === 'Pair' && token.content.value.length > 0;
    })
    .map(pair => {
      return [pair.content.key.content, pair.content.operator.content, pair.content.value.content];
    });
}

// Takes all tokens that are queries and joins them with spaces
function getQueryText(tokens) {
  return tokens
    .filter(token => token.type === 'Query' && token.content.length > 0)
    .map(token => token.content)
    .join(' ');
}

function cmaQueryBuilderForField(key, contentType) {
  const convertFn = getConverters(contentType)[key];
  if (convertFn) {
    return {
      context: {},
      build: convertFn
    };
  }

  const field = findField(key, contentType || {});
  if (field) {
    return {
      context: field,
      build: (op, val) => makeFieldQuery(field, op, val)
    };
  }

  return {
    context: {},
    build: () => ({})
  };
}

function getConverters(contentType) {
  if (!contentType || typeof get(contentType, ['sys', 'id']) === 'string') {
    return converters.Entry;
  } else {
    return converters.Asset;
  }
}

function makeFieldQuery(field, operator, value) {
  let queryKey = 'fields.' + apiNameOrId(field) + queryOperator(operator);
  if (field.type === 'Text') {
    queryKey = queryKey + '[match]';
  }
  if (field.type === 'Boolean') {
    value = value.match(/yes|true/i) ? 'true' : false;
  }
  if (field.type === 'Link') {
    queryKey = 'fields.' + apiNameOrId(field) + '.sys.id';
  }
  if (field.type === 'Array' && field.items.type === 'Link') {
    queryKey = 'fields.' + apiNameOrId(field) + '.sys.id';
  }

  return { [queryKey]: value };
}

function findField(key, contentType) {
  const fields = contentType.fields || [];
  const matchingId = fields.find(field => apiNameOrId(field) === key);
  const matchingName = fields.find(field => field.name.toLowerCase() === key.toLowerCase());
  return matchingId || matchingName;
}
