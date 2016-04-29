'use strict';

angular.module('contentful').controller('EntryListViewsController', ['$scope', '$injector', function($scope, $injector) {

  var $controller  = $injector.get('$controller');
  var uiConfig     = $injector.get('uiConfig');
  var systemFields = $injector.get('systemFields');
  var defaultOrder = _.clone(systemFields.getDefaultOrder());

  var SORTABLE_TYPES = [
    'Boolean',
    'Date',
    'Integer',
    'Number',
    'Symbol',
    'Location'
  ];

  $scope.getDefaultFieldIds = getDefaultFieldIds;

  $scope.fieldIsSortable = function (field) {
    return _.contains(SORTABLE_TYPES, field.type) && field.id !== 'author';
  };

  $scope.isOrderField = function (field) {
    return $scope.context.view.order.fieldId === field.id;
  };

  $scope.orderColumnBy = function (field) {
    if(!$scope.isOrderField(field)) setOrderField(field);
    $scope.context.view.order.direction = switchOrderDirection($scope.context.view.order.direction);
    $scope.updateEntries(true);
  };

  $scope.$watch('context.view.displayedFieldIds', function (displayedFieldIds) {
    if(!_.contains(displayedFieldIds, $scope.context.view.order.fieldId)){
      setOrderField(determineFallbackSortField(displayedFieldIds));
      $scope.updateEntries(true);
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
    resetList: function () {
      $scope.updateEntries(true);
    }
  });

  function setOrderField(field) {
    $scope.context.view.order = _.defaults({ fieldId: field.id }, defaultOrder);
  }

  function switchOrderDirection(direction) {
    return direction === 'ascending' ? 'descending' : 'ascending';
  }

  function getBlankView() {
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

  function determineFallbackSortField(displayedFieldIds) {
    if(_.contains(displayedFieldIds, 'publishedAt'))
      return systemFields.get('publishedAt');
    if(_.contains(displayedFieldIds, 'createdAt'))
      return systemFields.get('createdAt');
    // TODO this should be the first condition in this function
    // move it there when sorting is allowed by status
    if(_.contains(displayedFieldIds, 'updatedAt'))
      return systemFields.get('updatedAt');
    //if(_.contains(displayedFieldIds, 'status'))
    //return updatedAtField;
  }

  function getDefaultFieldIds() {
    return _.reject(_.map(systemFields.getList(), 'id'), function (fieldId) {
      return fieldId == 'createdAt' || fieldId == 'publishedAt';
    });
  }

  function generateDefaultViews(wait) {
    var cts = $scope.spaceContext.publishedContentTypes;
    if (wait) {
      var off = $scope.$watch('spaceContext.publishedContentTypes.length', function(len) {
        if (len > 0) {
          off();
          cts = $scope.spaceContext.publishedContentTypes;
          uiConfig.resetEntries(cts);
        }
      });
    } else {
      uiConfig.resetEntries(cts);
    }
  }

}]);
