'use strict';

angular.module('contentful').factory('ListQuery', ['$injector', function ($injector) {

  var systemFields = $injector.get('systemFields');
  var spaceContext = $injector.get('spaceContext');
  var buildQuery = $injector.get('search/queryBuilder');
  var TheLocaleStore = $injector.get('TheLocaleStore');
  var searchQueryHelper = $injector.get('searchQueryHelper');

  var ORDER_PREFIXES = {
    descending: '-',
    ascending: ''
  };

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
      return prepareEntityListQuery(searchQueryHelper.assetContentType, opts);
    }
  };

  function prepareEntityListQuery (contentType, opts) {
    var queryObject = {
      order: getOrderQuery(opts.order, contentType),
      limit: opts.paginator.pageLength,
      skip: opts.paginator.skipItems()
    };

    return buildQuery(spaceContext.space, contentType, opts.searchTerm)
      .then(function (searchQuery) {
        return _.extend(queryObject, searchQuery);
      });
  }

  function getOrderQuery (order, contentType) {
    return ORDER_PREFIXES[order.direction] + getFieldPath(order.fieldId, contentType);
  }

  function getFieldPath (fieldId, contentType) {
    // Usually we use a system field for ordering
    if (findFieldById(fieldId)) { return 'sys.' + fieldId; }

    var field = findFieldById(fieldId, contentType.data.fields);

    // In case the custom field saved in the view does not exist anymore
    if (!field) {
      return 'sys.' + systemFields.getDefaultOrder().fieldId;
    }

    // If the user has defined a custom field for ordering
    var defaultLocale = TheLocaleStore.getDefaultLocale().internal_code;
    return 'fields.' + apiNameOrId(field) + '.' + defaultLocale;
  }

  function findFieldById (id, fields) {
    return _.find(fields || systemFields.getList(), { id: id });
  }

  function apiNameOrId (field) {
    return field.apiName || field.id;
  }

}]);
