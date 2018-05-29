'use strict';
/**
 * @ngdoc service
 * @name ListQuery
 * @description
 * Various helpers for preparing API queries.
 */
angular.module('contentful').factory('ListQuery', ['require', function (require) {
  var $q = require('$q');
  var _ = require('lodash');
  var systemFields = require('systemFields');
  var spaceContext = require('spaceContext');
  var buildQueryFromUISearch = require('app/ContentList/Search/QueryBuilder').buildQuery;
  var assetContentType = require('assetContentType');

  var DEFAULT_ORDER = systemFields.getDefaultOrder();

  return {
    /**
     * @ngdoc method
     * @name ListQuery#getForEntries
     * @description
     * Prepares an API query for the entry list.
     *
     * @param {string} opts.contentTypeId
     * @param {string} opts.searchText
     * @param {object} opts.order
     * @param {Paginator} opts.paginator
     * @returns {object}
     */
    getForEntries: function (opts) {
      if (opts.contentTypeId) {
        return spaceContext.publishedCTs.fetch(opts.contentTypeId)
          .then(function (contentType) {
            return prepareEntityListQuery(contentType, opts);
          });
      } else {
        return prepareEntityListQuery(null, opts);
      }
    },
    /**
     * @ngdoc method
     * @name ListQuery#getForAssets
     * @description
     * Prepares an API query for the asset list.
     *
     * @param {string} opts.searchText
     * @param {object} opts.order
     * @param {Paginator} opts.paginator
     * @returns {object}
     */
    getForAssets: function (opts) {
      return prepareEntityListQuery(assetContentType, opts);
    },
    /**
     * @ngdoc method
     * @name ListQuery#getForUsers
     * @description
     * Prepares an API query for the user list.
     *
     * @param {Paginator} opts.paginator
     * @returns {object}
     */
    getForUsers: function (opts) {
      var userContentType = {
        data: {},
        getId: _.constant(undefined)
      };
      return prepareEntityListQuery(userContentType, opts);
    }
  };

  function prepareEntityListQuery (contentType, opts) {
    var queryObject = {
      order: getOrderQuery(opts.order, contentType),
      limit: opts.paginator.getPerPage(),
      skip: opts.paginator.getSkipParam(),
      'sys.archivedAt[exists]': 'false' // By default, don't get archived entries.
    };
    var searchQuery = buildQueryFromUISearch({
      contentType: _.get(contentType, 'data'), search: opts
    });
    // TODO: Lets not return a promise here.
    return $q.resolve(_.assign(queryObject, searchQuery));
  }

  function getOrderQuery (order, contentType) {
    order = prepareOrderObject(order);
    var prefix = order.direction === 'descending' ? '-' : '';

    return prefix + getOrderPath(order, contentType).join('.');
  }

  function prepareOrderObject (order) {
    order = _.clone(order) || {};
    order.fieldId = order.fieldId || DEFAULT_ORDER.fieldId;
    order.direction = order.direction || DEFAULT_ORDER.direction;

    return order;
  }

  // handling stored list order w/o distinction
  // between sys.% and fields.% paths
  function getOrderPath (order, contentType) {
    // check system fields first:
    if (isSystemField(order.fieldId)) {
      return ['sys', order.fieldId];
    }

    // and CT fields afterwards:
    var ctField = getCtField(order.fieldId, contentType);
    if (ctField) {
      return ['fields', ctField.apiName || ctField.id];
    }

    return ['sys', DEFAULT_ORDER.fieldId];
  }

  function isSystemField (id) {
    return !!_.find(systemFields.getList(), {id: id});
  }

  function getCtField (id, ct) {
    var ctFields = _.get(ct, 'data.fields', []);
    return _.find(ctFields, {id: id});
  }
}]);
