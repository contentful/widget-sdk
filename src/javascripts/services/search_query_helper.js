'use strict';
// Provide services to entrylistController and cfTokenizedSearch
angular.module('contentful').factory('searchQueryHelper', ['searchParser', 'userCache', '$q', 'searchQueryAutocompletions', 'AssetContentType', function(searchParser, userCache, $q, searchQueryAutocompletions, AssetContentType){
  var lastQueryString, lastParseResult = [];
  var complete = searchQueryAutocompletions.complete;
  var api = {
    // Dummy Content-Type object that can be used when searching for Assets
    // Whenever we're searching for/in fields, the code around the search stuff
    // needs a Content-Type to work with and build the queries
    assetContentType: {
      data: AssetContentType,
      getId: _.constant(undefined)
    },

    // Parse the queryString and return the current top-level token
    // This top-level token can have subtokens if it is a pair (key+operator+value)
    currentToken: function (queryString, cursorPos) {
      if (!queryString) return null;

      var tokens = parse(queryString);
      for (var i = 0, l = tokens.length; i < l; i ++) {
        var token = tokens[i];
        var pos = tokenPosition(cursorPos, token);
        if (pos.after) continue;
        if (pos.touch) return token;
      }
    },

    // Like currentToken, but returns the subtoken of a pair, not the pair itself
    currentSubToken: function (contentType, queryString, cursorPos) {
      var token = api.currentToken(queryString, cursorPos);
      if (token && token.type === 'Pair') {
        var p = token.content;
        var pos = tokenPosition(cursorPos, token.content.operator);
        var key = token.content.key.content;
        if (pos.before) return p.key;
        if (pos.pre)    return p.operator;
        else if (pos.end) {
          var values    = complete.value(key, contentType);
          return !_.isEmpty(values) ? p.value : p.operator;
        } else return p.value;
      } else {
        return token;
      }
    },

    // List of available autocompletions for current position
    offerCompletion: _.compose($q.when, function (space, contentType, queryString, cursorPos) {
      var token = api.currentToken(queryString, cursorPos);
      
      if (token && token.type === 'Pair') {
        var pos = tokenPosition(cursorPos, token.content.operator);
        var key = token.content.key.content;
        if (pos.pre) {
          return complete.operator(key, contentType);
        } else if (pos.end) {
          var operators = complete.operator(key, contentType),
              values    = complete.value(key, contentType);
          return !_.isEmpty(values)   ? values    :
                 operators.length > 1 ? operators : // if only 1 operator it has already been filled
                 [];
        } else if (pos.after) {
          return complete.value(key, contentType);
        }
      }
      return complete.key(contentType);
    }),

    // Gives the first valid operator for a key as a String
    operatorForKey: function (key, contentType) {
      return complete.operator(key, contentType).items[0].value;
    },

    // Build a Query for the CMA
    // Returns a request object that can be passed into space.getEntries()
    buildQuery: function (space, contentType, queryString) {
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
    }
  };

  return api;

  function parse(queryString) {
    if (queryString !== lastQueryString) {
      lastQueryString = queryString;
      try {
        lastParseResult = searchParser.parse(queryString);
      } catch (e) {
        lastParseResult = [];
      }
    }
    return lastParseResult;
  }

  // Returns an objects that has a bunch of boolean flags
  //
  // before: strictly before the token but not touching it
  // start: at the start of the token
  // inside: strictly inside the token
  // end: at the end of the token
  // after: strictly after the token
  //
  // outside: stricly before or after
  // pre: start or inside
  // post end or inside
  // touch: touching the token, either at the start or the end
  function tokenPosition(cursorPos, token) {
    var pos = {
      before: cursorPos     <  token.offset,
      start:  cursorPos    === token.offset,
      inside: token.offset  <  cursorPos && cursorPos < token.end,
      end:    cursorPos    === token.end,
      after:  token.end     <  cursorPos,
    };

    pos.outside = pos.before || pos.after;
    pos.pre     = pos.start  || pos.inside;
    pos.post    = pos.inside || pos.end;
    pos.touch   = pos.pre    || pos.post;

    return pos;
  }

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
