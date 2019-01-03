import { map } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const createCachedTokenParser = getModule('search/cachedParser');

const parseTokens = createCachedTokenParser();

export function parseTextQuery(textQuery) {
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
  const queryContents = map(queries, 'content');
  return queryContents.join(' ');
}
