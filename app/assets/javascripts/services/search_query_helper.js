'use strict';
angular.module('contentful').factory('searchQueryHelper', function(searchParser){
  var lastQueryString, lastParseResult;

  function parse(queryString) {
    if (queryString !== lastQueryString) {
      lastQueryString = queryString;
      lastParseResult = searchParser.parse(queryString);
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

  var api = {
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

    currentSubToken: function (contentType, queryString, cursorPos) {
      var token = api.currentToken(queryString, cursorPos);
      if (token && token.type === 'Pair') {
        var p = token.content;
        var pos = tokenPosition(cursorPos, token.content.operator);
        var key = token.content.key.content;
        if (pos.before) return p.key;
        if (pos.pre)    return p.operator;
        else if (pos.end) {
          var values    = valueCompletion(key, contentType);
          return !_.isEmpty(values) ? p.value : p.operator;
        } else return p.value;
      } else {
        return token;
      }
    },

    // TODO Make sure currentSubToken and offerCompletion are using the same logic to find the token

    offerCompletion: function (contentType, queryString, cursorPos) {
      var token = api.currentToken(queryString, cursorPos);
      
      if (token && token.type === 'Pair') {
        var pos = tokenPosition(cursorPos, token.content.operator);
        var key = token.content.key.content;
        if (pos.pre) {
          return operatorCompletion(key, contentType);
        } else if (pos.end) {
          var operators = operatorCompletion(key, contentType),
              values    = valueCompletion(key, contentType);
          return !_.isEmpty(values)   ? values    :
                 operators.length > 1 ? operators : // if 1 operator it has already been filled
                 [];
        } else if (pos.after) {
          return valueCompletion(key, contentType);
        }
      }
      return keyCompletion(contentType);
    },

    operatorsForKey: function (key, contentType) {
      return operatorCompletion(key, contentType);
    },

    buildQuery: function (contentType, queryString) {
      var requestObject = {};

      // Content Type
      var fields = createFieldsLookup(contentType);
      if (contentType) requestObject.content_type = contentType.getId();

      // Search
      if (queryString){
        var tokens = parse(queryString);
        var pairs = extractPairs(tokens);
        _.each(pairs, function (pair) {
          _.extend(requestObject, pairToRequestObject(pair.content.key.content, pair.content.value.content, fields));
        });
        _.tap(tokens[tokens.length-1], function (last) {
          if (last.type === 'Query') requestObject.query = last.content;
        });
      }

      // Filter out archived entries
      if (!('sys.archivedAt[exists]' in requestObject)) {
        requestObject['sys.archivedAt[exists]'] = 'false';
      }
      return requestObject;
    }
  };

  var autocompletion = {
    newerThan: {
      convert: function (exp) {
        try {
          return { 'sys.updatedAt[gte]': moment(exp).toISOString() };
        } catch(e) {
          return;
        }
      }
    },
    status: {
      complete: 'published changed draft archived'.split(' '),
      convert: {
        published: {'sys.publishedAt[exists]': 'true'},
        changed: {
          'sys.archivedAt[exists]': 'false',
          'changed': 'true'
        },
        draft: {
          'sys.archivedAt[exists]': 'false',
          'sys.publishedVersion[exists]': 'false',
          'changed': 'true'
        },
        archived: {
          'sys.archivedAt[exists]': 'true'
        }
      }
    }
  };

  function keyCompletion(contentType) {
    var completions = [];
    if (contentType)
      completions.push.apply(completions, _.keys(createFieldsLookup(contentType)));
    completions.push.apply(completions, _.keys(autocompletion));
    return completions;
  }

  function operatorCompletion(key, contentType) {
    console.log('LOL', key, contentType);
    return [':', '=='];
  }

  function valueCompletion(key, contentType) {
    if (!autocompletion[key]) {
      return predefinedFieldCompletion(key, contentType);
    }

    var complete = autocompletion[key].complete;
    if (_.isFunction(complete)) {
      return complete(contentType);
    } else {
      return complete;
    }
  }

  function predefinedFieldCompletion(key, contentType) {
    var field = createFieldsLookup(contentType)[key];
    if (field) {
      var val;
      // Predefined values
      val = _.find(field.validations, 'in');
      if (val) return val['in'];
      // Integer ranges
      val = field.type === 'Integer' && _.find(field.validations, 'range');
      if (val) return buildRange(val.range.min, val.range.max);
      // Booleans
      if (field.type === 'Boolean') return ['true', 'false'];
    }
    return null;
  }

  function buildRange(min, max) {
    if (!_.isNumber(max) || !_.isNumber(min) || max - min > 25 ) return null;
    var res = [];
    for (var i=min; i<= max; i++) res.push(i);
    return res;
  }

  // Date: with all the usual operators, bonus - relative times (e.g. 7 days ago)
  // Author: intelligent solution - just show people who authored entries,
  //         basic solution - show all the people in the Space
  // Content type: intelligent solution display content types with at least one entry,
  //               basic solution - retrieve all content types within a given space.
  //
  //
  // Content type specific variables:
  //     Support for searching assets:
  //         By specifying asset type
  //         By specifying asset extension (? if we can do it)
  //         By allowing to search only asset titles (e.g. asset_title : contains / does not contain X)
  //         By specifying asset size
  //         By combining asset creation with the date parameter from above (e.g. I imagine the query would look something like "status:created" "date:before 23, April 2014" "type:asset" "size:less than (Mb):2)

  function createFieldsLookup(contentType) {
    if (!contentType) return {};
    return _.reduce(contentType.data.fields, function (list, field) {
      if (!field.disabled) list[field.id] = field;
      return list;
    }, {});
  }

  function extractPairs(tokens) {
    return _.reduce(tokens, function (pairs, token) {
      if (token.type == 'Pair' && token.content.value.length > 0) pairs.push(token);
      return pairs;
    }, []);
  }

  function pairToRequestObject(key, value, fields) {
    var keyData = autocompletion[key];
    if (keyData) {
      if (_.isFunction(keyData.convert) ) return keyData.convert(value);
      if (_.isObject(keyData.convert)) {
        return createConverter(keyData.convert, value);
      }
    } else {
      return createFieldQuery(key, value, fields);
    }
  }

  function createConverter(convertData, value) {
    var converterForValue = convertData[value];
    if (!converterForValue) return;

    if (_.isFunction(converterForValue)) {
      return converterForValue(value);
    } else { //is requestObject
      return converterForValue;
    }
  }

  function createFieldQuery(key, value, fields) {
    var field = findField(key, fields);
    if (field) return _.tap({}, function (q) {
      var queryKey = 'fields.'+field.id;
      if (field.type === 'Text') queryKey = queryKey + '[match]';
      q[queryKey] = value;
    });
  }

  function findField(key, fields) {
    if (fields[key]) return fields[key];
    else return _.find(fields, function (field) {
      return field.name.toLowerCase() == key.toLowerCase();
    });
  }

  return api;
});
