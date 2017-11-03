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
.factory('searchQueryAutocompletions', ['require', function (require) {
  var spaceContext = require('spaceContext');
  var mimetype = require('mimetype');
  var assetContentType = require('assetContentType');
  var moment = require('moment');
  var caseofEq = require('libs/sum-types').caseofEq;
  var otherwise = require('libs/sum-types').otherwise;

  var NOT_SEARCHABLE_FIELD_TYPES = ['Location', 'Object', 'File'];

  var operatorDescriptions = {
    '<=': 'Less than or equal',
    '<': 'Less than',
    '>=': 'Greater than or equal',
    '>': 'Greater than',
    '=': 'Equal',
    '==': 'Equal',
    '!=': 'Not equal'
  };

  function operatorDescription (op) {
    return operatorDescriptions[op] || '';
  }

  var dateOperatorDescriptions = {
    '<=': 'Before or on that date/time',
    '<': 'Before that date/time',
    '>=': 'After or on that date/time',
    '>': 'After that date/time',
    '==': 'Exactly on that date/time',
    '!=': 'Not on that date/time'
  };

  function dateOperatorDescription (op) {
    return dateOperatorDescriptions[op] || '';
  }

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
      convert: function (_operator, value) {
        return {'sys.id': value};
      }
    },
    author: createUserAutocompletion({
      path: 'sys.createdBy.sys.id',
      description: 'User who created the item'
    }),
    updater: createUserAutocompletion({
      path: 'sys.updatedBy.sys.id',
      description: 'User who updated the item most recently'
    }),
    status: {
      description: 'Current status of the item',
      complete: makeListCompletion([
        {value: 'published', description: 'Published and visible to the public'},
        {value: 'changed', description: 'Was modified, but changes are invisible until re-published'},
        {value: 'draft', description: 'Not published, invisible to the public'},
        {value: 'archived', description: 'Not published and hidden from editors'}
      ]),
      convert: function (_operator, value) {
        return caseofEq(value, [
          ['published', function () {
            return {'sys.publishedAt[exists]': 'true'};
          }],
          ['changed', function () {
            return {
              'sys.archivedAt[exists]': 'false',
              'changed': 'true'
            };
          }],
          ['draft', function () {
            return {
              'sys.archivedAt[exists]': 'false',
              'sys.publishedVersion[exists]': 'false',
              'changed': 'true'
            };
          }],
          ['archived', function () {
            return {
              'sys.archivedAt[exists]': 'true'
            };
          }],
          [otherwise, function () {
            return {};
          }]
        ]);
      }
    }
  };

  function createUserAutocompletion (opts) {
    return {
      description: opts.description,
      complete: function () {
        return getUserMap().then(function (userMap) {
          var values = Object.keys(userMap).map(function (name) {
            return {value: '"' + name + '"', description: name};
          });
          return makeListCompletion(values);
        });
      },
      convert: function (_op, value) {
        return getUserMap().then(function (userMap) {
          if (userMap[value]) {
            var query = {};
            query[opts.path] = userMap[value];
            return query;
          }
        });
      }
    };
  }

  // Factories for assets
  var assetCompletions = _.extend({}, autocompletion, {
    width: imageDimensionCompletion('width', 'Width of an image in pixels'),
    height: imageDimensionCompletion('height', 'Height of an image in pixels'),
    type: {
      description: 'The filetype of the item',
      complete: makeListCompletion(_.map(mimetype.getGroupNames(), function (name, id) {
        return {value: id, description: name};
      })),
      convert: function (_operator, value) {
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
      convert: function (_op, value) {
        // TODO fuzzy [match]ing on filenames?
        return {'fields.file.fileName': value};
      }
    }
  });

  // Returns all the static autocompletions that are possible for the content Type.
  function staticAutocompletions (contentType) {
    // TODO do not use reference equality. We should check
    // 'contentType.getId() === undefined' instead.
    if (contentType === assetContentType) {
      return assetCompletions;
    } else {
      return autocompletion;
    }
  }

  // Generates a factory for completing a key that contains a date
  function dateCompletions (key, description) {
    var RELATIVE = /(\d+) +days +ago/i;
    var DAY = /^\s*\d{2,4}-\d{2}-\d{2}\s*$/;
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
        } catch (e) {
          return;
        }
      }
    };

    function dayEquality (op, exp) {
      return EQUALITY.test(op) && DAY.test(exp);
    }
  }

  // Generates a factory for completing image dimensions (width, height)
  function imageDimensionCompletion (key, description) {
    return {
      description: description,
      operators: makeOperatorList(['<', '<=', '==', '>=', '>']),
      convert: function (op, exp) {
        try {
          var query = {};
          query['fields.file.details.image.' + key + queryOperator(op)] = exp;
          return query;
        } catch (e) {
          return;
        }
      }
    };
  }

  // A map from usernames to the user IDs:
  // - by default user names are just "First Last"
  // - duplicates are differentiated with ID: "First Last (someid123)"
  function getUserMap () {
    return spaceContext.users.getAll().then(function (users) {
      var transformed = users.map(function (user) {
        return {
          id: user.sys.id,
          // remove double quotes from the name
          // this way user names don't break search box syntax
          name: (user.firstName + ' ' + user.lastName).replace('"', '')
        };
      });

      var counts = _.countBy(transformed, 'name');

      return transformed.reduce(function (acc, u) {
        var key = counts[u.name] > 1 ? (u.name + ' (' + u.id + ')') : u.name;
        acc[key] = u.id;
        return acc;
      }, {});
    });
  }

  /**
   * @description
   * Return completions for static fields (i.e. `sys`) properties and
   * dynamic fields on the Content Type.
   *
   * @param {Client.ContentType?} ct
   * @return {CompletionData}
   */
  function keyCompletion (ct) {
    var staticCompletions = _.map(staticAutocompletions(ct), function (completion, key) {
      return {value: key, description: completion.description};
    });

    var fieldCompletions = _.get(ct, ['data', 'fields'], [])
      .filter(function (field) {
        var isSearchable = !field.disabled && NOT_SEARCHABLE_FIELD_TYPES.indexOf(field.type) < 0;
        var isNotStaticDuplicate = !_.find(staticCompletions, {value: apiNameOrId(field)});
        return isSearchable && isNotStaticDuplicate;
      })
      .map(function (field) {
        return {
          value: apiNameOrId(field),
          description: field.name
        };
      });

    return makeListCompletion(fieldCompletions.concat(staticCompletions));
  }

  function operatorCompletion (key, contentType) {
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

  function valueCompletion (key, contentType) {
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
    function predefinedFieldCompletion (key, contentType) {
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
    function buildRange (min, max) {
      if (!_.isNumber(max) || !_.isNumber(min) || max - min > 25) return null;
      var res = [];
      for (var i = min; i <= max; i++) res.push(i);
      return res;
    }
  }

  /**
   * Given a [key, operator, value] triple, a content type and a space
   * we build CDA query object for this filter triple.
   */
  function filterToQueryObject (filter, contentType, space) {
    var key = filter[0];
    var operator = filter[1];
    var value = filter[2];
    var keyData = staticAutocompletions(contentType)[key];
    if (keyData) {
      return keyData.convert(operator, value, space);
    }

    var field = findField(key, contentType);
    if (field) {
      return makeFieldQuery(field, operator, value);
    } else {
      return {};
    }
  }

  function makeFieldQuery (field, operator, value) {
    var q = {};

    // TODO Using apiNameOrId here is a temporary solution while the backend doesn't honor
    // the Skip-Transformation header for field.ids in searches
    var queryKey = 'fields.' + apiNameOrId(field) + queryOperator(operator);
    if (field.type === 'Text') {
      queryKey = queryKey + '[match]';
    }
    if (field.type === 'Boolean') {
      value = value.match(/yes|true/i) ? 'true' : false;
    }
    if (field.type === 'Link') {
      queryKey = 'fields.' + apiNameOrId(field) + '.sys.id';
    }
    if (field.type === 'Array' && field.items.type === 'Link') {
      queryKey = 'fields.' + apiNameOrId(field) + '.sys.id';
    }
    q[queryKey] = value;
    return q;
  }

  // Helpers {{{1

  // Convert operator into operator for the querystring
  // CONVERT(datecompletions) + PAIRTOREQUESTOBJECT
  function queryOperator (op) {
    return op === '<=' ? '[lte]'
      : op === '<' ? '[lt]'
      : op === '>=' ? '[gte]'
      : op === '>' ? '[gt]'
      : op === '!=' ? '[ne]'
      : '';
  }

  function apiNameOrId (field) {
    if (field.apiName) {
      return field.apiName;
    } else {
      return field.id;
    }
  }

  function sizeParser (exp) {
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
  function makeListCompletion (values) {
    return {
      type: 'List',
      items: _.map(values, function (val) {
        return _.isPlainObject(val) ? val : {value: '"' + val + '"'};
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

  function makeDateCompletion () {
    return {
      type: 'Date'
    };
  }

  // API {{{1

  // The public facing API for this service
  return {
    complete: {
      key: keyCompletion,
      operator: operatorCompletion,
      value: valueCompletion
    },
    filterToQueryObject: filterToQueryObject
  };

  // }}}
}]);
