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
   * @param {Client.ContentType}  contentType
   * @param {string}              queryString
   * @returns {Promise<object>}
   */
  return function buildQuery (space, contentType, queryString) {
    var requestObject = {};
    if (contentType) requestObject.content_type = contentType.getId();

    var tokens = parse(queryString);
    var pairs = extractPairs(tokens);
    return $q.all(_.map(pairs, function (pair) {
      return searchQueryAutocompletions.pairToRequestObject(pair, contentType, space);
    }))
    .then(function (reqObjects) {
      return _.each(reqObjects, function (o) {
        _.extend(requestObject, o);
      });
    })
    .then(function () {
      _.tap(extractQuery(tokens), function (query) {
        if (query.length > 0) requestObject.query = query;
      });
      // Filter out archived entries
      if (!('sys.archivedAt[exists]' in requestObject)) {
        requestObject['sys.archivedAt[exists]'] = 'false';
      }
      return requestObject;
    });
  };


  // Returns only pairs with a value from a list of tokens
  function extractPairs(tokens) {
    return _.filter(tokens, function (token) {
      return token.type == 'Pair' && token.content.value.length > 0;
    });
  }

  // Takes all tokens that are queries and joins them with spaces
  function extractQuery(tokens) {
    return _(tokens).filter(function (token) {
      return token.type == 'Query' && token.content.length > 0;
    }).map(function(token){return token.content;}).value().join(' ');
  }


}]);
