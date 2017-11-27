import $q from '$q';
import { filterToQueryObject } from 'searchQueryAutocompletions';
import createCachedTokenParser from 'search/cachedParser';
import {map, extend} from 'lodash';
import {assign} from 'utils/Collections';

const parseTokens = createCachedTokenParser();

/**
 * @ngdoc method
 * @name search/queryBuilder#default
 * @description
 * Build an API query from a legacy text query (`searchTerm`) provided by the user.
 * @param {Space} space
 * @param {ContentType?} contentType
 * @param {string} textQuery Legacy text query.
 * @returns {Promise<object>}
 */
export function buildQuery (space, contentType, textQuery) {
  const {filters, queryText} = parseTextQuery(textQuery);

  const queryItems = $q.all(
    filters.map((filter) => filterToQueryObject(filter, contentType, space))
  );

  return queryItems
  .then((queryItems) => {
    let queryObject = extend.bind(null, {}).apply(null, queryItems);

    if (queryText.length > 0) {
      queryObject = assign(queryObject, { query: queryText });
    }

    if (contentType) {
      queryObject = assign(queryObject, { content_type: contentType.getId() });
    }

    return queryObject;
  });
}

export function parseTextQuery (textQuery) {
  const tokens = parseTokens(textQuery);
  const filters = getFilters(tokens);
  const queryText = getQueryText(tokens);
  return {filters, queryText};
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
function getQueryText (tokens) {
  const queries = tokens.filter((token) => {
    return token.type === 'Query' && token.content.length > 0;
  });
  const queryContents = map(queries, 'content');
  return queryContents.join(' ');
}
