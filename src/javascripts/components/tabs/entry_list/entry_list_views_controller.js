'use strict';

angular.module('contentful')
.controller('EntryListViewsController', ['$scope', '$injector', function ($scope, $injector) {

  var $controller = $injector.get('$controller');
  var uiConfig = $injector.get('uiConfig');
  var systemFields = $injector.get('systemFields');
  var defaultOrder = systemFields.getDefaultOrder();

  var SORTABLE_TYPES = [
    'Boolean',
    'Date',
    'Integer',
    'Number',
    'Symbol',
    'Location'
  ];

  // @todo some old todo stated that "status" should
  // be the first of fallback fields when it'll be supported.
  // Revisit when rewriting entity lists.
  var FALLBACK_FIELDS = [
    'publishedAt',
    'createdAt',
    'updatedAt'
  ];

  $scope.getDefaultFieldIds = getDefaultFieldIds;

  $scope.fieldIsSortable = function (field) {
    return _.includes(SORTABLE_TYPES, field.type) && field.id !== 'author';
  };

  $scope.isOrderField = function (field) {
    return $scope.context.view.order.fieldId === field.id;
  };

  $scope.orderColumnBy = function (field) {
    if (!$scope.isOrderField(field)) {
      setOrderField(field);
    }
    $scope.context.view.order.direction = switchOrderDirection($scope.context.view.order.direction);
    $scope.updateEntries();
  };

  $scope.$watch('context.view.displayedFieldIds', function (displayedFieldIds) {
    if (!_.includes(displayedFieldIds, $scope.context.view.order.fieldId)) {
      setOrderField(determineFallbackSortField(displayedFieldIds));
      $scope.updateEntries();
    }
  }, true);

  $scope.orderDescription = function (view) {
    var field = _.find($scope.displayedFields, {id: view.order.fieldId});
    var direction = view.order.direction;
    return '' + direction + ' by ' + field.name;
  };

  $scope.getFieldList = function () {
    return _.map($scope.displayedFields, 'name').join(', ');
  };

  return $controller('ListViewsController', {
    $scope: $scope,
    getBlankView: getBlankView,
    viewCollectionName: 'entryListViews',
    generateDefaultViews: generateDefaultViews,
    preserveStateAs: 'entries',
    resetList: _.noop
  });

  function setOrderField (field) {
    $scope.context.view.order = _.defaults({ fieldId: field.id }, defaultOrder);
  }

  function switchOrderDirection (direction) {
    return direction === 'ascending' ? 'descending' : 'ascending';
  }

  function getBlankView () {
    return {
      title: 'New View',
      searchTerm: null,
      contentTypeId: null,
      contentTypeHidden: false,
      id: null,
      order: defaultOrder,
      displayedFieldIds: getDefaultFieldIds()
    };
  }

  function determineFallbackSortField (displayedFieldIds) {
    var fallbackId = _.find(FALLBACK_FIELDS, function (fieldId) {
      return _.includes(displayedFieldIds, fieldId);
    });

    return systemFields.get(fallbackId) || {id: undefined};
  }

  function getDefaultFieldIds () {
    return _.reject(_.map(systemFields.getList(), 'id'), function (fieldId) {
      return fieldId === 'createdAt' || fieldId === 'publishedAt';
    });
  }

  function generateDefaultViews (wait) {
    var cts = $scope.spaceContext.publishedContentTypes;
    if (wait) {
      var off = $scope.$watch('spaceContext.publishedContentTypes.length', function (len) {
        if (len > 0) {
          off();
          cts = $scope.spaceContext.publishedContentTypes;
          return uiConfig.resetEntries(cts);
        }
      });
    } else {
      return uiConfig.resetEntries(cts);
    }
  }

}]);
