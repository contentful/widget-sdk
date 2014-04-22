'use strict';
angular.module('contentful').factory('searchQueryHelper', function(searchParser, userCache, $q){
  var lastQueryString, lastParseResult = [];

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

    offerCompletion: _.compose($q.when, function (space, contentType, queryString, cursorPos) {
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
    }),

    operatorsForKey: function (key, contentType) {
      return operatorCompletion(key, contentType);
    },

    buildQuery: function (space, contentType, queryString) {
      var requestObject = {};

      // Content Type
      var fields = createFieldsLookup(contentType);
      if (contentType) requestObject.content_type = contentType.getId();

      // Search
      var tokens = parse(queryString);
      var pairs = extractPairs(tokens);
      return $q.all(_.map(pairs, function (pair) {
          return pairToRequestObject(
            pair.content.key.content,
            pair.content.operator.content,
            pair.content.value.content,
            fields, space);
      }))
      .then(function (reqObjects) {
        return _.each(reqObjects, function (o) {
          _.extend(requestObject, o);
        });
      })
      .then(function () {
        _.tap(tokens[tokens.length-1], function (last) {
          if (last && last.type === 'Query') requestObject.query = last.content;
        });
        // Filter out archived entries
        if (!('sys.archivedAt[exists]' in requestObject)) {
          requestObject['sys.archivedAt[exists]'] = 'false';
        }
        return requestObject;
      });
    }
  };

  function dateCompletions(key) {
    var regex = /(\d+) +days +ago/i;
    return {
      operators: ['<', '<=', '==', '>=', '>'],
      convert: function (op, exp) {
        try {
          var match = regex.exec(exp);
          var date = match ? moment().subtract('days', match[1]) : moment(exp);
          var query = {};
          query[key + queryOperator(op)] = date.toISOString();
          return query;
        } catch(e) {
          return;
        }
      }
    };
  }

  var autocompletion = {
    updatedAt: dateCompletions('sys.updatedAt'),
    createdAt: dateCompletions('sys.createdAt'),
    author: {
      complete: function (contentType, space) {
        return getUserMap(space).then(function (userMap) {
          return _(userMap).keys().map(function (userName) {
            return '"'+userName+'"';
          }).value();
        });
      },
      convert: function (operator, value, space) {
        return getUserMap(space).then(function (userMap) {
          if (userMap[value]) {
            var query = {};
            query['sys.createdBy.sys.id'] = userMap[value];
            return query;
          }
        });
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

  function getUserMap(space) {
    return userCache.getAll(space).then(function (users) {
      var names = _.map(users, 'getName');
      var occurences = _.countBy(names);
      return _.transform(users, function (map, user) {
        var name = user.getName();
        name = occurences[name] > 1 ? name + ' (' +user.getId()+ ')' : name;
        map[name] = user.getId();
      }, {});
    });
  }

  function queryOperator(op) {
    return op == '<=' ? '[lte]' :
           op == '<'  ? '[lt]'  :
           op == '>=' ? '[gte]' :
           op == '>'  ? '[gt]'  :
           '';
  }

  function keyCompletion(contentType) {
    var completions = [];
    if (contentType)
      completions.push.apply(completions, _.keys(createFieldsLookup(contentType)));
    completions.push.apply(completions, _.keys(autocompletion));
    return completions;
  }

  function operatorCompletion(key, contentType) {
    if (!autocompletion[key]) return operatorsForField(key, contentType);
    return autocompletion[key].operators || ':';
  }

  function operatorsForField(fieldId, contentType) {
    var field = createFieldsLookup(contentType)[fieldId] || {};
    if (field.type === 'Integer' || field.type === 'Number' || field.type === 'Date') {
      return ['<', '<=', '==', '>=', '>'];
    }
    return [':'];
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
  //
  // calendar dates
  // author -> users

  function createFieldsLookup(contentType) {
    if (!contentType) return {};
    return _.reduce(contentType.data.fields, function (list, field) {
      if (fieldSearchable(field)) list[field.id] = field;
      return list;
    }, {});
  }

  function fieldSearchable(field) {
    return !field.disabled && !field.type.match(/Location|Link|Object|Array/);
  }

  function extractPairs(tokens) {
    return _.reduce(tokens, function (pairs, token) {
      if (token.type == 'Pair' && token.content.value.length > 0) pairs.push(token);
      return pairs;
    }, []);
  }

  function pairToRequestObject(key, operator, value, fields, space) {
    var keyData = autocompletion[key];
    if (keyData) {
      if (_.isFunction(keyData.convert) ) return keyData.convert(operator, value, space);
      if (_.isObject(keyData.convert)) {
        return createConverter(keyData.convert, operator, value, space);
      }
    } else {
      return createFieldQuery(key, operator, value, fields);
    }
  }

  function createConverter(convertData, operator, value, space) {
    var converterForValue = convertData[value];
    if (!converterForValue) return;

    if (_.isFunction(converterForValue)) {
      return converterForValue(operator, value, space);
    } else { //is requestObject
      return converterForValue;
    }
  }

  function createFieldQuery(key, operator, value, fields) {
    var field = findField(key, fields);
    if (field) return _.tap({}, function (q) {
      // TODO discern between operators
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
