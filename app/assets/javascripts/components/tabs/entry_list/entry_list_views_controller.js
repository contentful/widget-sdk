'use strict';
angular.module('contentful').controller('EntryListViewsController', function($scope, random, $controller){
  var DEFAULT_ORDER_DIRECTION = 'descending';

  var SORTABLE_TYPES = [
    'Boolean',
    'Date',
    'Integer',
    'Number',
    'Symbol',
    'Location'
  ];

  var updatedAtField = {
    id: 'updatedAt',
    name: 'Updated',
    type: 'Date',
    sys: true,
    persistent: true
  };

  var authorField = {
    id: 'author',
    name: 'Author',
    type: 'Symbol',
    sys: true
  };

  $scope.systemFields = [
    updatedAtField,
    authorField
  ];

  $scope.fieldIsSortable = function (field) {
    return _.contains(SORTABLE_TYPES, field.type) && field.id !== 'author';
  };

  $scope.isOrderField = function (field) {
    return $scope.tab.params.view.order.fieldId === field.id;
  };

  $scope.setOrderField = function (field) {
    setOrderField(field);
    $scope.resetEntries(true);
  };

  $scope.orderColumnBy = function (field) {
    if(!$scope.isOrderField(field)) setOrderField(field);
    $scope.tab.params.view.order.direction = switchOrderDirection($scope.tab.params.view.order.direction);
    $scope.resetEntries(true);
  };

  $scope.$watch('tab.params.view.displayedFieldIds', function (displayedFieldIds) {
    if(!_.contains(displayedFieldIds, $scope.tab.params.view.order.fieldId))
      $scope.setOrderField(updatedAtField);
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
    resetList: function () {
      $scope.resetEntries(true);
    }
  });

  function setOrderField(field) {
    $scope.tab.params.view.order = {
      fieldId: field.id,
      direction: DEFAULT_ORDER_DIRECTION
    };
  }

  function switchOrderDirection(direction) {
    return direction === 'ascending' ? 'descending' : 'ascending';
  }

  function getBlankView() {
    return {
      title: 'New View',
      searchTerm: null,
      contentTypeId: null,
      id: null,
      order: {
        fieldId: updatedAtField.id,
        direction: DEFAULT_ORDER_DIRECTION
      },
      displayedFieldIds: _.map($scope.systemFields, 'id')
    };
  }

  function generateDefaultViews(wait) {
    var contentTypes;
    if (wait) {
      contentTypes = [];
      $scope.waitFor('spaceContext.publishedContentTypes.length > 0', function () {
        contentTypes.push.apply(contentTypes, contentTypeViews());
      });
    } else {
      contentTypes = contentTypeViews();
    }
    return [
      {
        id: 'default',
        title: 'Views',
        views: [{
          id: random.id(),
          title: 'All',
          order: makeOrder(),
          displayedFieldIds: fieldIds()
        }]
      },
      {
        id: random.id(),
        title: 'Status',
        views: [
          {title: 'Published', searchTerm: 'status:published', id: random.id(), order: makeOrder(), displayedFieldIds: fieldIds()},
          {title: 'Changed',   searchTerm: 'status:changed'  , id: random.id(), order: makeOrder(), displayedFieldIds: fieldIds()},
          {title: 'Draft',     searchTerm: 'status:draft'    , id: random.id(), order: makeOrder(), displayedFieldIds: fieldIds()},
          {title: 'Archived',  searchTerm: 'status:archived' , id: random.id(), order: makeOrder(), displayedFieldIds: fieldIds()}
        ]
      },
      {
        id: random.id(),
        title: 'Content Type',
        views: contentTypes
      }
    ];

    function contentTypeViews() {
      return _.map($scope.spaceContext.publishedContentTypes, function (contentType) {
        return {
          title: contentType.data.name,
          contentTypeId: contentType.getId(),
          id: random.id(),
          order: makeOrder(),
          displayedFieldIds: fieldIds()
        };
      });
    }

    function makeOrder() {
      return { fieldId: updatedAtField.id, direction: DEFAULT_ORDER_DIRECTION };
    }

    function fieldIds() {
      return _.map($scope.systemFields, 'id');
    }
  }

});
