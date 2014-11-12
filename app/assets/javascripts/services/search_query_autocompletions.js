'use strict';
angular.module('contentful').factory('searchQueryAutocompletions', ['userCache', 'mimetype', 'AssetContentType', function(userCache, mimetype, AssetContentType){
  // Autocomplete object {{{1

  // Predefined keys and their completions/conversions
  // PAIRTOREQUEST + COMPLETIONS
  var autocompletion = {
    updatedAt: dateCompletions('sys.updatedAt', 'Date the item was modified'),
    createdAt: dateCompletions('sys.createdAt', 'Date the item was created'),
    publishedAt: dateCompletions('sys.publishedAt', 'Date the item was last published'),
    firstPublishedAt: dateCompletions('sys.firstPublishedAt', 'Date the item was published for the first time'),
    author: {
      description: 'User who created the item',
      complete: function (contentType, space) {
        return getUserMap(space).then(function (userMap) {
          return makeListCompletion(_(userMap).keys().map(function (userName) {
            return {value: '"'+userName+'"', description: userName};
          }).value());
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
      description: 'Current status of the item',
      complete: makeListCompletion([
        {value: 'published', description: 'Published and visible to the public'},
        {value: 'changed'  , description: 'Was modified, but changes are invisible until re-published'},
        {value: 'draft'    , description: 'Not published, invisible to the public'},
        {value: 'archived' , description: 'Not published and hidden from editors'},
      ]),
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

  var assetcompletions = {
    width: imageDimensionCompletion('width', 'Width of an image in pixels'),
    height: imageDimensionCompletion('height', 'Height of an image in pixels'),
    type: {
      description: 'The filetype of the item',
      complete: makeListCompletion(_.map(mimetype.groupDisplayNames, function (name, id) {
        return {value: id, description: name};
      })),
      convert: function (operator, value) {
        return {mimetype_group: value};
      }
    },
    size: {
      description: 'The filesize of the item',
      operators: makeOperatorList(['<', '<=', '==', '>=', '>']),
      convert: function (operator, value) {
        var query = {};
        value = sizeParser(value);
        query['fields.file.details.size' + queryOperator(operator)] = value;
        return query;
      }
    },
    // TODO image sizes, extract numerical stuff, filesize image size dates etc in function
    filename: {
      description: 'The exact filename of the item',
      convert: function (op, value) {
        // TODO fuzzy [match]ing on filenames?
        return {'fields.file.fileName': value};
      }
    }
  };

  function staticAutocompletions(contentType) {
    if (contentType && contentType.data === AssetContentType) {
      return _.extend({}, autocompletion, assetcompletions);
    } else {
      return autocompletion;
    }
  }

  function staticKeys(contentType) {
    var completions = staticAutocompletions(contentType);
    return _.map(completions, function (completion, key) {
      return {value: key, description: completion.description};
    });
  }

  function dateCompletions(key, description) {
    var RELATIVE = /(\d+) +days +ago/i;
    var DAY      = /^\s*\d{2,4}-\d{2}-\d{2}\s*$/;
    var EQUALITY = /^==|=|:$/;
    return {
      description: description,
      operators: makeOperatorList(['==', '<', '<=', '>=', '>'], 'Date'),
      complete: makeDateCompletion(),
      convert: function (op, exp) {
        try {
          var match = RELATIVE.exec(exp);
          var date = match ? moment().subtract('days', match[1]) : moment(exp);
          if (date.isValid()) {
            var query = {};
            if (dayEquality(op, exp)) {
              query[key + queryOperator('>=')] = date.startOf('day').toISOString();
              query[key + queryOperator('<=')] = date.endOf('day').toISOString();
            } else {
              query[key + queryOperator(op)] = date.toISOString();
            }
            return query;
          }
        } catch(e) {
          return;
        }
      }
    };

    function dayEquality(op, exp) {
      return EQUALITY.test(op) && DAY.test(exp);
    }
  }

  function imageDimensionCompletion(key, description) {
    return {
      description: description,
      operators: makeOperatorList(['<', '<=', '==', '>=', '>']),
      convert: function (op, exp) {
        try {
          var query = {};
          query['fields.file.details.image.' + key + queryOperator(op)] = exp;
          return query;
        } catch(e) {
          return;
        }
      }
    };
  }

  // A map from usernames to the user ids
  // User names are "First Last"
  // If this results in duplicates, the duplicates are returned as "First Last (ID)"
  // BOTH
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

  // Completions {{{1

  function keyCompletion(contentType) {
    return makeListCompletion(_.union(
      searchableFieldIds(contentType),
      staticKeys(contentType)));

    function searchableFieldIds(contentType) {
      if (!contentType) return [];
      return _.transform(contentType.data.fields, function (fieldIds, field) {
        if (fieldSearchable(field)) fieldIds.push({
          value: apiNameOrId(field),
          description: field.name});
      });
    }

    // Tells if a field is searchable or not
    function fieldSearchable(field) {
      return !field.disabled && !field.type.match(/Location|Object|File/);
    }
  }

  function operatorCompletion(key, contentType) {
    var completions = staticAutocompletions(contentType);
    if (completions[key]) {
      return makeListCompletion(completions[key].operators || makeOperatorList([':']));
    } else {
      return makeListCompletion(operatorsForField(key, contentType));
    }

    // Offer available operators for a certain field of a content type
    // Based on field type and validations
    function operatorsForField(fieldId, contentType) {
      var field = findField(fieldId, contentType) || {};
      if (field.type === 'Integer' || field.type === 'Number' || field.type === 'Date') {
        return makeOperatorList(['<', '<=', '==', '>=', '>']);
      }
      return makeOperatorList([':']);
    }
  }

  function valueCompletion(key, contentType) {
    var completions = staticAutocompletions(contentType);
    if (!completions[key]) {
      return predefinedFieldCompletion(key, contentType);
    }

    var complete = completions[key].complete;
    if (_.isFunction(complete)) {
      return complete(contentType);
    } else {
      return complete;
    }

    // Offer set of valid values as autocompletions for fields
    // with predefined values/numeric ranges
    function predefinedFieldCompletion(key, contentType) {
      var field = findField(key, contentType);
      if (field) {
        var val;
        // Predefined values
        val = _.find(field.validations, 'in');
        if (val) return makeListCompletion(val['in']);
        // Integer ranges
        val = field.type === 'Integer' && _.find(field.validations, 'range');
        if (val) return makeListCompletion(buildRange(val.range.min, val.range.max));
        // Booleans
        if (field.type === 'Boolean') return makeListCompletion(['yes', 'no']);
        // Dates
        if (field.type === 'Date') return makeDateCompletion();
      }
      return null;
    }

    // Turn a min and a max into an array of intermediate values
    function buildRange(min, max) {
      if (!_.isNumber(max) || !_.isNumber(min) || max - min > 25 ) return null;
      var res = [];
      for (var i=min; i<= max; i++) res.push(i);
      return res;
    }
  }

  // Pair to RequestObject Conversion {{{1

  function pairToRequestObject(pair, contentType, space) {
    var key      = pair.content.key.content;
    var operator = pair.content.operator.content;
    var value    = pair.content.value.content;
    var keyData  = staticAutocompletions(contentType)[key];
    if (keyData) {
      if (_.isFunction(keyData.convert) ) return keyData.convert(operator, value, space);
      if (_.isObject(keyData.convert)) {
        return createConverter(keyData.convert, operator, value, space);
      }
    } else {
      return createFieldQuery(key, operator, value, contentType);
    }

    // Turn a converter object into a requestobject
    function createConverter(convertData, operator, value, space) {
      var converterForValue = convertData[value];
      if (!converterForValue) return;

      if (_.isFunction(converterForValue)) {
        return converterForValue(operator, value, space);
      } else { //is requestObject
        return converterForValue;
      }
    }

    // Turn a field query into a requestobject
    function createFieldQuery(key, operator, value, contentType) {
      var field = findField(key, contentType);
      if (field) return _.tap({}, function (q) {
        // TODO Using apiNameOrId here is a temporary solution while the backend doesn't honor
        // the Skip-Transformation header for field.ids in searches
        var queryKey = 'fields.'+ apiNameOrId(field) + queryOperator(operator);
        if (field.type === 'Text') queryKey = queryKey + '[match]';
        if (field.type === 'Boolean') value = value.match(/yes|true/i) ? 'true' : false;
        if (field.type === 'Link') {
          queryKey = 'fields.'+apiNameOrId(field)+'.sys.id';
        }
        if (field.type === 'Array' && field.items.type == 'Link') {
          queryKey = 'fields.'+apiNameOrId(field)+'.sys.id';
        }
        q[queryKey] = value;
      });
    }
  }

  // Helpers {{{1

  // Convert operator into operator for the querystring
  // CONVERT(datecompletions) + PAIRTOREQUESTOBJECT
  function queryOperator(op) {
    return op == '<=' ? '[lte]' :
           op == '<'  ? '[lt]'  :
           op == '>=' ? '[gte]' :
           op == '>'  ? '[gt]'  :
           op == '!=' ? '[ne]'  :
           '';
  }

  function apiNameOrId(field) {
    if (field.apiName) {
      return field.apiName;
    } else {
      return field.id;
    }
  }

  function sizeParser(exp) {
    var number = parseInt(exp, 10);
    if (number < 1) return exp;

    if (exp.match(/kib/i)) {
      return number * 1024;
    } else if (exp.match(/kb?/i)) {
      return number * 1000;
    } else if (exp.match(/mib/i)) {
      return number * 1024 * 1024;
    } else if (exp.match(/mb?/i)) {
      return number * 1000 * 1000;
    } else {
      return exp;
    }
  }

  // Identifies a field by its ID, falling back to searching by name
  // COMPLETIONS + PAIRTOREQUESTOBJECT
  function findField(key, contentType) {
    var fields = contentType ? contentType.data.fields : [];
    return _.find(fields, match) || _.find(fields, function (field) {
      return field.name.toLowerCase() == key.toLowerCase();
    });

    function match(field) {
      return apiNameOrId(field) === key;
    }
  }

  function makeListCompletion(values) {
    return {
      type: 'List',
      items: _.map(values, function (val) {
        return _.isPlainObject(val) ? val : {value: val};
      })
    };
  }

  function makeOperatorList(operators, type) {
    return _.map(operators, function (op) {
      return {value: op, description: descriptions(op)};
    });

    function descriptions(op) {
      if (type === 'Date') {
        return op == '<=' ? 'Before or on that date/time' :
               op == '<'  ? 'Before that date/time'       :
               op == '>=' ? 'After or on that date/time'  :
               op == '>'  ? 'After that date/time'        :
               op == '==' ? 'Exactly on that date/time'   :
               op == '!=' ? 'Not on that date/time'       :
               '';
      } else {
        return op == '<=' ? 'Less than or equal'    :
               op == '<'  ? 'Less than'             :
               op == '>=' ? 'Greater than or equal' :
               op == '>'  ? 'Greater than'          :
               op == '='  ? 'Equal'                 :
               op == '==' ? 'Equal'                 :
               op == '!=' ? 'Not equal'             :
               '';
        }
      }
  }

  function makeDateCompletion() {
    return {
      type: 'Date'
    };
  }

  // API {{{1

  return {
    complete: {
      key:      keyCompletion,
      operator: operatorCompletion,
      value:    valueCompletion
    },
    pairToRequestObject: pairToRequestObject
  };

  // }}}
}]);

