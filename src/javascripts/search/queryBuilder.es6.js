import parse from './legacySearchParser.es6';

export function parseTextQuery(textQuery) {
  const tokens = parseTokens(textQuery);
  const filters = getFilters(tokens);
  const queryText = getQueryText(tokens);
  return { filters, queryText };
}

function parseTokens(textQuery) {
  try {
    const tokens = parse(textQuery);
    return Array.isArray(tokens) ? tokens : [];
  } catch (err) {
    return [];
  }
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

  return queries.map(q => q.content).join(' ');
}
