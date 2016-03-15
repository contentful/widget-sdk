'use strict';
// Service to generate autocompletions for the tokenized search
//
// The public API for this is at the bottom of the file.
//
// A "completion" looks like this:
//
//    {
//      type: 'List',
//      items: [
//        {value: '...', description: '...'}
//      ]
//    }
//
// or like this:
//   { type: 'Date' }
//
// These are the only two kinds right now. They are both handled by separate components.
// The date completion obviously doesn't need a list, it uses a calendar widget instead.
//
// This file is separated into five parts (search for "{{{1")
// - First, autocompletion factories are defined
// - Then Completion functions
// - Then PairToRequest function
// - A couple of helper methods
// - The public facing API, exposing some functions to the outside
angular.module('contentful')
.factory('searchQueryAutocompletions', ['$injector',function($injector) {

  var spaceContext     = $injector.get('spaceContext');
  var mimetype         = $injector.get('mimetype');
  var AssetContentType = $injector.get('AssetContentType');
  var $q               = $injector.get('$q');
  var moment           = $injector.get('moment');

  function operatorDescription (op) {
    return operatorDescriptions[op] || '';
  }

  var operatorDescriptions = {
    '<=': 'Less than or equal',
    '<' : 'Less than',
    '>=': 'Greater than or equal',
    '>' : 'Greater than',
    '=' : 'Equal',
    '==': 'Equal',
    '!=': 'Not equal'
  };

  function dateOperatorDescription (op) {
    return dateOperatorDescriptions[op] || '';
  }

  var dateOperatorDescriptions = {
    '<=': 'Before or on that date/time',
    '<' : 'Before that date/time',
    '>=': 'After or on that date/time',
    '>' : 'After that date/time',
    '==': 'Exactly on that date/time',
    '!=': 'Not on that date/time'
  };


  // Autocomplete object {{{1
  //
  // This part contains autocompletion factories for key/value pairs
  // These factories have several properties
  // - description: A description of meaning of the key
  // - operators: valid operator completions
  // - complete: valid value completions (format see at the top of this file)
  // - convert: convert convert an operator and a value to a query object
  //            that can be passed to the CMA
  //
  // The operators property can either be a "completions" object or a function that returns one.
  // The complete property can either be a "completions" object or a function that returns one.
  // The convert property can either be a map from searchfield value -> query object
  //   or a function that returns a query object
  //
  // In this part the different factories are grouped together by topic

  // Factories for predefined keys. These keys are available for every kind of query
  // PAIRTOREQUEST + COMPLETIONS
  var autocompletion = {
    updatedAt: dateCompletions('sys.updatedAt', 'Date the item was modified'),
    createdAt: dateCompletions('sys.createdAt', 'Date the item was created'),
    publishedAt: dateCompletions('sys.publishedAt', 'Date the item was last published'),
    firstPublishedAt: dateCompletions('sys.firstPublishedAt', 'Date the item was published for the first time'),
    id: {
      description: 'Unique identifier',
      convert: function (operator, value) {
        return $q.resolve({
          'sys.id': value
        });
      }
    },
    author: {
      description: 'User who created the item',
      complete: function () {
        return getUserMap().then(function (userMap) {
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

  // Factories for assets
  var assetcompletions = {
    width: imageDimensionCompletion('width', 'Width of an image in pixels'),
    height: imageDimensionCompletion('height', 'Height of an image in pixels'),
    type: {
      description: 'The filetype of the item',
      complete: makeListCompletion(_.map(mimetype.getGroupNames(), function (name, id) {
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

  // Returns all the static autocompletions that are possible for the content Type.
  function staticAutocompletions(contentType) {
    if (contentType && contentType.data === AssetContentType) {
      return _.extend({}, autocompletion, assetcompletions);
    } else {
      return autocompletion;
    }
  }

  // All possible keys for a content Type
  function staticKeys(contentType) {
    var completions = staticAutocompletions(contentType);
    return _.map(completions, function (completion, key) {
      return {value: key, description: completion.description};
    });
  }

  // Generates a factory for completing a key that contains a date
  function dateCompletions(key, description) {
    var RELATIVE = /(\d+) +days +ago/i;
    var DAY      = /^\s*\d{2,4}-\d{2}-\d{2}\s*$/;
    var EQUALITY = /^(==|=|:)$/;
    return {
      description: description,
      operators: makeDateOperatorList(),
      complete: makeDateCompletion(),
      convert: function (op, exp) {
        try {
          var match = RELATIVE.exec(exp);
          var date = match ? moment().subtract(match[1], 'days') : moment(exp);
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

  // Generates a factory for completing image dimensions (width, height)
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
  function getUserMap () {
    return spaceContext.users.getAll().then(function (users) {
      var names = _.map(users, 'getName');
      var occurences = _.countBy(names);
      return _.transform(users, function (map, user) {
        var name = user.getName();
        name = occurences[name] > 1 ? name + ' (' +user.getId()+ ')' : name;
        map[name] = user.getId();
      }, {});
    });
  }

  /**
   * @description
   * Return completions for static fields (i.e. `sys`) properties and
   * dynamic fields on the Content Type.
   *
   * @param {Client.ContentType?} contentType
   * @return {CompletionData}
   */
  function keyCompletion (contentType) {
    return makeListCompletion(_.union(
      searchableFieldCompletions(contentType),
      staticKeys(contentType)));

    function searchableFieldCompletions (contentType) {
      if (!contentType) return [];

      var fields = contentType.data.fields;
      var searchableFields = _.filter(fields, fieldIsSearchable);
      return _.map(searchableFields, function (field) {
        return {
          value: apiNameOrId(field),
          description: field.name
        };
      });
    }

    function fieldIsSearchable(field) {
      return !field.disabled && !field.type.match(/Location|Object|File/);
    }
  }

  function operatorCompletion(key, contentType) {
    var completions = staticAutocompletions(contentType);
    if (completions[key]) {
      return makeListCompletion(completions[key].operators || makeOperatorList([':']));
    } else {
      return fieldOperatorCompletion(key, contentType);
    }

    /**
     * @description
     * Offer available operators for a certain field of a content type
     * Based on field type and validations
     *
     * @param {string} fieldId
     * @param {Client.ContentType} contentType
     * @returns {CompletionData}
     */
    function fieldOperatorCompletion (fieldId, contentType) {
      var field = findField(fieldId, contentType) || {};
      var type = field ? field.type : null;
      if (type === 'Integer' || type === 'Number' || type === 'Date') {
        return makeOperatorListCompletion(['<', '<=', '==', '>=', '>']);
      } else {
        return makeOperatorListCompletion([':']);
      }
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
  //
  // This part contains the function that turns a parsed key/value pair into a queryObject

  function pairToRequestObject(pair, contentType, space) {
    var key      = pair.content.key.content;
    var operator = pair.content.operator.content;
    var value    = pair.content.value.content;
    var keyData  = staticAutocompletions(contentType)[key];
    if (keyData) {
      if (_.isFunction(keyData.convert)) {
        return keyData.convert(operator, value, space);
      }
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

  /**
   * Identifies a field by its ID, falling back to searching by name
   * COMPLETIONS + PAIRTOREQUESTOBJECT
   *
   * @param {string}  key
   * @param {Client.ContentType?}  contentType
   *
   * @returns {API.ContentType.Field?}
   */
  function findField (key, contentType) {
    if (!contentType) {
      return;
    }

    var fields = contentType.data.fields;
    return _.find(fields, matchApiName) || _.find(fields, matchFieldLabel);

    function matchApiName (field) {
      return apiNameOrId(field) === key;
    }

    function matchFieldLabel (field) {
      return field.name.toLowerCase() === key.toLowerCase();
    }
  }

  // Helper for creating a listCompletion from values
  //
  // values can either be strings or {value, description} objects
  function makeListCompletion(values) {
    return {
      type: 'List',
      items: _.map(values, function (val) {
        return _.isPlainObject(val) ? val : {value: val};
      })
    };
  }

  /**
   * @param {string[]} operators
   * @returns {CompletionData}
   */
  function makeOperatorListCompletion (operators) {
    return makeListCompletion(makeOperatorList(operators));
  }

  // Helper for creating a list completion with operators
  // with descriptions based on the type of the key
  function makeOperatorList (operators) {
    return _.map(operators, function (op) {
      return {value: op, description: operatorDescription(op)};
    });
  }

  function makeDateOperatorList () {
    var operators = ['==', '<', '<=', '>=', '>'];
    return _.map(operators, function (op) {
      return {value: op, description: dateOperatorDescription(op)};
    });
  }

  function makeDateCompletion() {
    return {
      type: 'Date'
    };
  }

  // API {{{1

  // The public facing API for this service
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
