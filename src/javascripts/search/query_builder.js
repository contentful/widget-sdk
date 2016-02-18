'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name search/queryBuilder
 * @description
 * Build an API query from a query string provided by the user.
 */
.factory('search/queryBuilder', ['$injector', function ($injector) {
  var $q                         = $injector.get('$q');
  var searchQueryAutocompletions = $injector.get('searchQueryAutocompletions');
  var createParser               = $injector.get('search/cachedParser');

  var parse = createParser();

  /**
   * @ngdoc method
   * @name search/queryBuilder#self
   * @param {Client.Space}        space
   * @param {Client.ContentType?}  contentType
   * @param {string}              queryString
   * @returns {Promise<object>}
   */
  return function buildQuery (space, contentType, queryString) {
    var requestObject = {};
    if (contentType) {
      requestObject.content_type = contentType.getId();
    }

    var tokens = parse(queryString);
    var pairs = filterPairs(tokens);

    return $q.all(_.map(pairs, createQueryPairParser(space, contentType)))
    .then(function (queryItems) {
      _.each(queryItems, function (o) {
        _.extend(requestObject, o);
      });

      var query = extractQuery(tokens);
      if (query.length > 0) {
        requestObject.query = query;
      }

      _.defaults(requestObject, {
        'sys.archivedAt[exists]': 'false'
      });

      return requestObject;
    });
  };


  function createQueryPairParser (space, contentType) {
    return function parse (pair) {
      return searchQueryAutocompletions.pairToRequestObject(pair, contentType, space);
    };
  }


  function filterPairs (tokens) {
    return _.filter(tokens, function (token) {
      return token.type == 'Pair' && token.content.value.length > 0;
    });
  }

  // Takes all tokens that are queries and joins them with spaces
  function extractQuery (tokens) {
    var queries = _.filter(tokens, function (token) {
      return token.type == 'Query' && token.content.length > 0;
    });
    var queryContents = _.map(queries, 'content');
    return queryContents.join(' ');
  }

}]);
