const _ = require('lodash');
const helpers = require('./helpers');
const autocompletion = require('./auto-completion');
const assetCompletions = require('./asset-completions');
const parse = require('./legacy-search-parser');

module.exports = {
  cmaQueryBuilderForField,
  parseTextQuery,
  parseTokens
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
  const pairs = tokens.filter(token => {
    return token.type === 'Pair' && token.content.value.length > 0;
  });
  return pairs.map(pair => {
    return [pair.content.key.content, pair.content.operator.content, pair.content.value.content];
  });
}

// Takes all tokens that are queries and joins them with spaces
function getQueryText(tokens) {
  const queries = tokens.filter(token => {
    return token.type === 'Query' && token.content.length > 0;
  });
  const queryContents = _.map(queries, 'content');
  return queryContents.join(' ');
}

function cmaQueryBuilderForField(key, contentType, getAllUsers) {
  const keyData = staticAutocompletions(contentType, getAllUsers)[key];
  if (keyData) {
    return {
      context: keyData,
      build: _.wrap(keyData.convert, (convert, operator, value) =>
        Promise.resolve(convert(operator, value))
      )
    };
  }
  const field = helpers.findField(key, contentType);
  if (field) {
    return {
      context: field,
      build: function(operator, value) {
        return Promise.resolve(makeFieldQuery(field, operator, value));
      }
    };
  }
  return {
    context: {},
    build: function() {
      return Promise.resolve({});
    }
  };
}

// Returns all the static autocompletions that are possible for the content Type.
function staticAutocompletions(contentType, getAllUsers) {
  if (!contentType || typeof _.get(contentType, ['sys', 'id']) === 'string') {
    return autocompletion(getAllUsers);
  } else {
    return assetCompletions(getAllUsers);
  }
}

function makeFieldQuery(field, operator, value) {
  const q = {};

  // TODO Using apiNameOrId here is a temporary solution while the backend doesn't honor
  // the Skip-Transformation header for field.ids in searches
  let queryKey = 'fields.' + helpers.apiNameOrId(field) + helpers.queryOperator(operator);
  if (field.type === 'Text') {
    queryKey = queryKey + '[match]';
  }
  if (field.type === 'Boolean') {
    value = value.match(/yes|true/i) ? 'true' : false;
  }
  if (field.type === 'Link') {
    queryKey = 'fields.' + helpers.apiNameOrId(field) + '.sys.id';
  }
  if (field.type === 'Array' && field.items.type === 'Link') {
    queryKey = 'fields.' + helpers.apiNameOrId(field) + '.sys.id';
  }
  q[queryKey] = value;
  return q;
}
