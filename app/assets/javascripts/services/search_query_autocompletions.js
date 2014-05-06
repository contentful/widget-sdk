'use strict';
angular.module('contentful').factory('searchQueryAutocompletions', function(userCache, mimetype, AssetContentType){
  // Autocomplete object {{{1

  // Predefined keys and their completions/conversions
  // PAIRTOREQUEST + COMPLETIONS
  var autocompletion = {
    updatedAt: dateCompletions('sys.updatedAt'),
    createdAt: dateCompletions('sys.createdAt'),
    publishedAt: dateCompletions('sys.publishedAt'),
    firstPublishedAt: dateCompletions('sys.firstPublishedAt'),
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

  var assetcompletions = {
    //width: imageDimensionCompletion('width'),
    //height: imageDimensionCompletion('height'),
    type: {
      complete: _.keys(mimetype.groupDisplayNames),
      convert: function (operator, value) {
        return {mimetype_group: value};
      }
    },
    size: {
      operators: ['<', '<=', '==', '>=', '>'],
      convert: function (operator, value) {
        var query = {};
        value = sizeParser(value);
        query['fields.file.details.size' + queryOperator(operator)] = value;
        return query;
      }
    },
    // TODO image sizes, extract numerical stuff, filesize image size dates etc in function
    filename: {
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

  function dateCompletions(key) {
    var regex = /(\d+) +days +ago/i;
    return {
      operators: ['<', '<=', '==', '>=', '>'],
      complete: 'date',
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

  function imageDimensionCompletion(key) {
    return {
      operators: ['<', '<=', '==', '>=', '>'],
      convert: function (op, exp) {
        try {
          var query = {};
          query['file.details.image.' + key + queryOperator(op)] = exp;
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
    return _.union( searchableFieldIds(contentType), _.keys(staticAutocompletions(contentType)));

    function searchableFieldIds(contentType) {
      if (!contentType) return [];
      return _.transform(contentType.data.fields, function (fieldIds, field) {
        if (fieldSearchable(field)) fieldIds.push(field.id);
      });
    }

    // Tells if a field is searchable or not
    function fieldSearchable(field) {
      return !field.disabled && !field.type.match(/Location|Link|Object|Array|File/);
    }
  }

  function operatorCompletion(key, contentType) {
    var completions = staticAutocompletions(contentType);
    if (!completions[key]) return operatorsForField(key, contentType);
    return completions[key].operators || ':';

    // Offer available operators for a certain field of a content type
    // Based on field type and validations
    function operatorsForField(fieldId, contentType) {
      var field = findField(fieldId, contentType) || {};
      if (field.type === 'Integer' || field.type === 'Number' || field.type === 'Date') {
        return ['<', '<=', '==', '>=', '>'];
      }
      return [':'];
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
        if (val) return val['in'];
        // Integer ranges
        val = field.type === 'Integer' && _.find(field.validations, 'range');
        if (val) return buildRange(val.range.min, val.range.max);
        // Booleans
        if (field.type === 'Boolean') return ['yes', 'no'];
        // Dates
        if (field.type === 'Date') return 'date';
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
        var queryKey = 'fields.'+field.id + queryOperator(operator);
        if (field.type === 'Text') queryKey = queryKey + '[match]';
        if (field.type === 'Boolean') value = value.match(/yes|true/i) ? 'true' : false;
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
    return _.find(fields, {id: key}) || _.find(fields, function (field) {
      return field.name.toLowerCase() == key.toLowerCase();
    });
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
});

