'use strict';
// Provide services to entrylistController and cfTokenizedSearch
angular.module('contentful').factory('searchQueryHelper', function(searchParser, userCache, $q, searchQueryAutocompletions, AssetContentType){
  var lastQueryString, lastParseResult = [];
  var complete = searchQueryAutocompletions.complete;
  var api = {
    assetContentType: {
      data: AssetContentType,
      getId: _.constant(undefined)
    },
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

    operatorsForKey: function (key, contentType) {
      return complete.operator(key, contentType);
    },

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

  function extractQuery(tokens) {
    return _(tokens).filter(function (token) {
      return token.type == 'Query' && token.content.length > 0;
    }).map(function(token){return token.content;}).value().join(' ');
  }

});
