import $q from '$q';
import { filterToQueryObject } from 'searchQueryAutocompletions';
import createCachedTokenParser from 'search/cachedParser';
import {map} from 'lodash';
import {assign} from 'utils/Collections';

const parseTokens = createCachedTokenParser();

/**
 * @ngdoc method
 * @name search/queryBuilder#default
 * @description
 * Build an API query from a query string provided by the user.
 * @param {Client.Space}         space
 * @param {Client.ContentType?}  contentType
 * @param {string}               queryString
 * @returns {Promise<object>}
 */
export function buildQuery (space, contentType, queryString) {
  const [filters, textQuery] = parse(queryString);

  const queryItems = $q.all(
    filters.map((filter) => filterToQueryObject(filter, contentType, space))
  );


  return queryItems
  .then((queryItems) => {
    let queryObject = queryItems.reduce((queryObject, queryItem) => assign(queryObject, queryItem), {});

    if (textQuery.length > 0) {
      queryObject = assign(queryObject, { query: textQuery });
    }

    if (contentType) {
      queryObject = assign(queryObject, { content_type: contentType.getId() });
    }

    return queryObject;
  });
}


function parse (string) {
  const tokens = parseTokens(string);
  const filters = getFilters(tokens);
  const textQuery = getTextQuery(tokens);
  return [filters, textQuery];
}


// Returns a list of [key, operator, value] pairs from tokens
function getFilters (tokens) {
  const pairs = tokens.filter((token) => {
    return token.type === 'Pair' && token.content.value.length > 0;
  });
  return pairs.map((pair) => {
    return [
      pair.content.key.content,
      pair.content.operator.content,
      pair.content.value.content
    ];
  });
}

// Takes all tokens that are queries and joins them with spaces
function getTextQuery (tokens) {
  const queries = tokens.filter((token) => {
    return token.type === 'Query' && token.content.length > 0;
  });
  const queryContents = map(queries, 'content');
  return queryContents.join(' ');
}
