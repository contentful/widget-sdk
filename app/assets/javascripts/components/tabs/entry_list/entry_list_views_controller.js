'use strict';
angular.module('contentful').controller('EntryListViewsController', ['$scope', 'random', '$controller', function($scope, random, $controller){
  var DEFAULT_ORDER_DIRECTION = 'descending';

  var SORTABLE_TYPES = [
    'Boolean',
    'Date',
    'Integer',
    'Number',
    'Symbol',
    'Location'
  ];

  var createdAtField = {
    id: 'createdAt',
    name: 'Created',
    type: 'Date',
    sys: true,
    canPersist: true
  };

  var updatedAtField = {
    id: 'updatedAt',
    name: 'Updated',
    type: 'Date',
    sys: true,
    canPersist: true
  };

  var publishedAtField = {
    id: 'publishedAt',
    name: 'Published',
    type: 'Date',
    sys: true,
    canPersist: true
  };

  var authorField = {
    id: 'author',
    name: 'Author',
    type: 'Symbol',
    sys: true
  };

  var contentTypeField = {
    id: 'contentType',
    name: 'Content Type',
    type: 'Symbol'
  };

  $scope.systemFields = [
    updatedAtField,
    createdAtField,
    publishedAtField,
    authorField
  ];

  $scope.getDefaultFieldIds = getDefaultFieldIds;

  $scope.fieldIsSortable = function (field) {
    return _.contains(SORTABLE_TYPES, field.type) && field.id !== 'author';
  };

  $scope.isOrderField = function (field) {
    return $scope.tab.params.view.order.fieldId === field.id;
  };

  $scope.orderColumnBy = function (field) {
    if(!$scope.isOrderField(field)) setOrderField(field);
    $scope.tab.params.view.order.direction = switchOrderDirection($scope.tab.params.view.order.direction);
    $scope.resetEntries(true);
  };

  $scope.$watch('tab.params.view.displayedFieldIds', function (displayedFieldIds) {
    if(!_.contains(displayedFieldIds, $scope.tab.params.view.order.fieldId)){
      setOrderField(determineFallbackSortField(displayedFieldIds));
      $scope.resetEntries(true);
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
    currentViewLocation: 'tab.params.view',
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
      contentTypeHidden: false,
      id: null,
      order: {
        fieldId: updatedAtField.id,
        direction: DEFAULT_ORDER_DIRECTION
      },
      displayedFieldIds: getDefaultFieldIds()
    };
  }

  function determineFallbackSortField(displayedFieldIds) {
    if(_.contains(displayedFieldIds, 'publishedAt'))
      return publishedAtField;
    if(_.contains(displayedFieldIds, 'createdAt'))
      return createdAtField;
    // TODO this should be the first condition in this function
    // move it there when sorting is allowed by status
    if(_.contains(displayedFieldIds, 'updatedAt'))
      return updatedAtField;
    //if(_.contains(displayedFieldIds, 'status'))
    //return updatedAtField;
  }

  function getDefaultFieldIds() {
    return _.reject(_.map($scope.systemFields, 'id'), function (fieldId) {
      return fieldId == 'createdAt' || fieldId == 'publishedAt';
    });
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
          displayedFieldIds: getDefaultFieldIds()
        }]
      },
      {
        id: random.id(),
        title: 'Status',
        views: [
          {title: 'Published', searchTerm: 'status:published', id: random.id(), order: makeOrder(), displayedFieldIds: getDefaultFieldIds()},
          {title: 'Changed',   searchTerm: 'status:changed'  , id: random.id(), order: makeOrder(), displayedFieldIds: getDefaultFieldIds()},
          {title: 'Draft',     searchTerm: 'status:draft'    , id: random.id(), order: makeOrder(), displayedFieldIds: getDefaultFieldIds()},
          {title: 'Archived',  searchTerm: 'status:archived' , id: random.id(), order: makeOrder(), displayedFieldIds: getDefaultFieldIds()}
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
          displayedFieldIds: getDefaultFieldIds()
        };
      });
    }

    function makeOrder() {
      return { fieldId: updatedAtField.id, direction: DEFAULT_ORDER_DIRECTION };
    }

  }

}]);
