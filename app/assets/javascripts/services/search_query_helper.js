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
      var requestObject = {};
      if (!queryString) return requestObject;
      var tokens = searchParser.parse(queryString);

      var pairs = _.reduce(tokens, function (pairs, token) {
        if (token._type == 'pair') pairs.push(token);
        return pairs;
      }, []);

      _.each(pairs, function (pair) {
        if (pair.value._type === 'Query') {
          var ro = pairToRequestObject(pair.key.token, pair.value.token);
          _.extend(requestObject, ro);
        }
      });

      _.tap(tokens[tokens.length-1], function (last) {
        if (last._type === 'Query') requestObject.query = last.token;
      });

      if (!('sys.archivedAt[exists]' in requestObject)) {
        requestObject['sys.archivedAt[exists]'] = false;
      }

      function pairToRequestObject(key, value) {
        var keyData = autocompletion[key];
        if (!keyData) return;

        if (_.isFunction(keyData.convert) ) return keyData.convert(value);
        if (_.isObject(keyData.convert)) {
          return createConverter(keyData.convert, value);
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

    // Date: with all the usual operators, bonus - relative times (e.g. 7 days ago)
    // Author: intelligent solution - just show people who authored entries,
    //         basic solution - show all the people in the Space
    // Content type: intelligent solution display content types with at least one entry,
    //               basic solution - retrieve all content types within a given space.
    //
    //
    // Content type specific variables:
    //     Only consider visible fields
    //     Autocompletion for predefined fields
    //     Make sure that we grab predefined values from all the supported fields (e.g. not only text, but also symbols, numbers);
    //     When grabbing predefined values from a text field
    //         Think through how we will show it if values are > than 50 characters
    //         there are more than 10 values in the list
    //     Support filtering through boolean value fields;
    //     Support for searching assets:
    //         By specifying asset type
    //         By specifying asset extension (? if we can do it)
    //         By allowing to search only asset titles (e.g. asset_title : contains / does not contain X)
    //         By specifying asset size
    //         By combining asset creation with the date parameter from above (e.g. I imagine the query would look something like "status:created" "date:before 23, April 2014" "type:asset" "size:less than (Mb):2)
    //               
  };

  return stuff;
});
