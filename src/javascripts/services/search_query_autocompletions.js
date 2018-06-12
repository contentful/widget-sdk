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
.factory('searchQueryAutocompletions', ['require', require => {
  var $q = require('$q');
  var mimetype = require('mimetype');
  var assetContentType = require('assetContentType');
  var moment = require('moment');
  var _ = require('lodash');
  var caseofEq = require('sum-types').caseofEq;
  var otherwise = require('sum-types').otherwise;

  // Require on demand to avoid circular dependency error in `spaceContext`.
  var requireSpaceContext = _.once(() => require('spaceContext'));

  var RELATIVE_DATE_REGEX = /(\d+) +days +ago/i;

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
          ['published', () => ({
            'sys.publishedAt[exists]': 'true'
          })],
          ['changed', () => ({
            'sys.archivedAt[exists]': 'false',
            'changed': 'true'
          })],
          ['draft', () => ({
            'sys.archivedAt[exists]': 'false',
            'sys.publishedVersion[exists]': 'false',
            'changed': 'true'
          })],
          ['archived', () => ({
            'sys.archivedAt[exists]': 'true'
          })],
          [otherwise, () => ({})]
        ]);
      }
    }
  };

  function createUserAutocompletion (opts) {
    return {
      description: opts.description,
      complete: function () {
        return getUserMap().then(userMap => {
          var values = Object.keys(userMap).map(name => ({
            value: '"' + name + '"',
            description: name
          }));
          return makeListCompletion(values);
        });
      },
      convert: function (_op, value) {
        return getUserMap().then(userMap => {
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
      complete: makeListCompletion(_.map(mimetype.getGroupNames(), (name, id) => ({
        value: id,
        description: name
      }))),
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
    var DAY = /^\s*\d{2,4}-\d{2}-\d{2}\s*$/;
    var EQUALITY = /^(==|=|:)$/;
    return {
      description: description,
      operators: makeDateOperatorList(),
      complete: makeDateCompletion(),
      convert: function (op, exp) {
        try {
          var match = RELATIVE_DATE_REGEX.exec(exp);
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
    return requireSpaceContext().users.getAll().then(users => {
      var transformed = users.map(user => ({
        id: user.sys.id,

        // remove double quotes from the name
        // this way user names don't break search box syntax
        name: (user.firstName + ' ' + user.lastName).replace('"', '')
      }));

      var counts = _.countBy(transformed, 'name');

      return transformed.reduce((acc, u) => {
        var key = counts[u.name] > 1 ? (u.name + ' (' + u.id + ')') : u.name;
        acc[key] = u.id;
        return acc;
      }, {});
    });
  }

  /**
   * Given a [key, operator, value] triple, a content type and a space
   * we build CDA query object for this filter triple.
   */
  function filterToQueryObject (filter, contentType, space) {
    var key = filter[0];
    var operator = filter[1];
    var value = filter[2];
    var buildCMAQuery = cmaQueryBuilderForField(key, contentType, space);
    return buildCMAQuery.build(operator, value);
  }

  function cmaQueryBuilderForField (key, contentType, space) {
    var keyData = staticAutocompletions(contentType)[key];
    if (keyData) {
      return {
        context: keyData,
        build: _.wrap(keyData.convert, (convert, operator, value) => $q.resolve(convert(operator, value, space)))
      };
    }
    var field = findField(key, contentType);
    if (field) {
      return {
        context: field,
        build: function (operator, value) {
          return $q.resolve(makeFieldQuery(field, operator, value));
        }
      };
    }
    return {
      context: {},
      build: function () { return $q.resolve({}); }
    };
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
      items: _.map(values, val => _.isPlainObject(val) ? val : {value: '"' + val + '"'})
    };
  }

  // Helper for creating a list completion with operators
  // with descriptions based on the type of the key
  function makeOperatorList (operators) {
    return _.map(operators, op => ({
      value: op,
      description: operatorDescription(op)
    }));
  }

  function makeDateOperatorList () {
    var operators = ['==', '<', '<=', '>=', '>'];
    return _.map(operators, op => ({
      value: op,
      description: dateOperatorDescription(op)
    }));
  }

  function makeDateCompletion () {
    return {
      type: 'Date'
    };
  }

  function isRelativeDate (value) {
    return RELATIVE_DATE_REGEX.test(value);
  }

  // API {{{1

  // The public facing API for this service
  return {
    filterToQueryObject: filterToQueryObject,
    cmaQueryBuilderForField: cmaQueryBuilderForField,
    isRelativeDate: isRelativeDate
  };

  // }}}
}]);
