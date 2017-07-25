'use strict';

angular.module('contentful').factory('ListQuery', ['$injector', function ($injector) {

  var systemFields = $injector.get('systemFields');
  var spaceContext = $injector.get('spaceContext');
  var buildQuery = $injector.get('search/queryBuilder');
  var assetContentType = $injector.get('assetContentType');

  var DEFAULT_ORDER = systemFields.getDefaultOrder();

  return {
    /**
     * @param {string} opts.contentTypeId
     * @param {string} opts.searchTerm
     * @param {string} opts.order
     *   TODO it is a structured value
     * @param {Paginator} opts.paginator
     * @returns {Query}
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
     * TODO document
     * TODO we should probably limit the number of items to keep query
     * url size low
     */
    getForEntryCollection: function (ids, order, paginator) {
      return prepareEntityListQuery(null, {
        order: order,
        paginator: paginator
      }).then(function (query) {
        query['sys.id[in]'] = ids.join(',');
        return query;
      });
    },
    getForAssets: function (opts) {
      return prepareEntityListQuery(assetContentType, opts);
    },
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
      skip: opts.paginator.getSkipParam()
    };

    return buildQuery(spaceContext.space, contentType, opts.searchTerm)
      .then(function (searchQuery) {
        return _.extend(queryObject, searchQuery);
      });
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
    var ctFields = dotty.get(ct, 'data.fields', []);
    return _.find(ctFields, {id: id});
  }
}]);
