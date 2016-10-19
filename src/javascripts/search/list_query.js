'use strict';

angular.module('contentful').factory('ListQuery', ['$injector', function ($injector) {

  var systemFields = $injector.get('systemFields');
  var spaceContext = $injector.get('spaceContext');
  var buildQuery = $injector.get('search/queryBuilder');
  var assetContentType = $injector.get('assetContentType');

  var DEFAULT_ORDER = systemFields.getDefaultOrder();
  var DEFAULT_ORDER_PATH = ['sys', DEFAULT_ORDER.fieldId];

  return {
    getForEntries: function (opts) {
      if (opts.contentTypeId) {
        return spaceContext.fetchPublishedContentType(opts.contentTypeId)
        .then(function (contentType) {
          return prepareEntityListQuery(contentType, opts);
        });
      } else {
        return prepareEntityListQuery(null, opts);
      }
    },
    getForAssets: function (opts) {
      return prepareEntityListQuery(assetContentType, opts);
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

    return DEFAULT_ORDER_PATH;
  }

  function isSystemField (id) {
    return !!_.find(systemFields.getList(), {id: id});
  }

  function getCtField (id, ct) {
    var ctFields = dotty.get(ct, 'data.fields', []);
    return _.find(ctFields, {id: id});
  }
}]);
