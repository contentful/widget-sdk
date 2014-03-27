'use strict';
angular.module('contentful').factory('searchQueryHelper', function(searchParser){
  var stuff = {
    //offerCompletion: function (contentType, queryString, cursorPos) {
      // TODO need to extend the parser for that to support
      // less strict formatting and intermediate pairs
    //},

    buildQuery: function (contentType, queryString) {
      //var fields = _.reduce(contentType.data.fields, function (list, field) {
        //list[field.id] = field;
      //}, {});
      var query = {};
      if (!queryString) return query;
      var search = searchParser.parse(queryString);

      _.each(search.pairs, function (pair) {
        _.extend(query, pairToQuery(pair.key, pair.exp));
      });

      if (search.search) {
        query.query = search.search;
      }

      if (!('sys.archivedAt[exists]' in query)) {
        query['sys.archivedAt[exists]'] = false;
      }

      function pairToQuery(key, expression) {
        var keyData = autocompletion[key];
        if (!keyData) return;

        if (_.isFunction(keyData.convert) ) return keyData.convert(expression);
        if (_.isObject(keyData.convert)) {
          return createConverter(keyData.convert, expression);
        }
      }

      function createConverter(convertData, expression) {
        var converterForExpression = convertData[expression];
        if (!converterForExpression) return;

        if (_.isFunction(converterForExpression)) {
          return converterForExpression(expression);
        } else { //is Query
          return converterForExpression;
        }
      }

      return query;
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

    // Date: with all the usual operators, bonus - relative times (e.g. 7 days ago)
    // Author: intelligent solution - just show people who authored entries,
    //         basic solution - show all the people in the Space
    // Content type: intelligent solution display content types with at least one entry,
    //               basic solution - retrieve all content types within a given space.
  };

  return stuff;
});
