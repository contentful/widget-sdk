'use strict';
angular.module('contentful').controller('EntryListViewsController', function($scope, sentry, random, modalDialog, notification){
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
    sys: true
  };

  var updatedAtField = {
    id: 'updatedAt',
    name: 'Updated',
    type: 'Date',
    sys: true
  };

  var publishedAtField = {
    id: 'publishedAt',
    name: 'Published',
    type: 'Date',
    sys: true
  };

  var authorField = {
    id: 'author',
    name: 'Author',
    type: 'Symbol',
    sys: true
  };

  $scope.systemFields = [
    updatedAtField,
    createdAtField,
    publishedAtField,
    authorField
  ];

  function fieldIds() {
    return _.reject(_.map($scope.systemFields, 'id'), function (fieldId) {
      return fieldId == 'createdAt' || fieldId == 'publishedAt';
    });
  }
  $scope.getDefaultFieldIds = fieldIds;

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
      displayedFieldIds: fieldIds()
    };
  }

  $scope.$watch('uiConfig', function (uiConfig) {
    if (uiConfig && !uiConfig.entryListViews) {
      uiConfig.entryListViews = generateDefaultViews(true);
    }
  });

  var blankView = getBlankView();

  $scope.tab.params.view = $scope.tab.params.view || getBlankView();

  $scope.resetViews = function () {
    $scope.uiConfig.entryListViews = generateDefaultViews();
    $scope.saveViews();
  };

  $scope.fieldIsSortable = function (field) {
    return _.contains(SORTABLE_TYPES, field.type) && field.id !== 'author';
  };

  $scope.isOrderField = function (field) {
    return $scope.tab.params.view.order.fieldId === field.id;
  };

  function setOrderField(field) {
    $scope.tab.params.view.order = {
      fieldId: field.id,
      direction: DEFAULT_ORDER_DIRECTION
    };
  }

  $scope.orderColumnBy = function (field) {
    if(!$scope.isOrderField(field)) setOrderField(field);
    $scope.tab.params.view.order.direction = switchOrderDirection($scope.tab.params.view.order.direction);
    $scope.resetEntries(true);
  };

  function switchOrderDirection(direction) {
    return direction === 'ascending' ? 'descending' : 'ascending';
  }

  $scope.$watch('tab.params.view.displayedFieldIds', function (displayedFieldIds) {
    //  Published date > Created date > Status;
    if(!_.contains(displayedFieldIds, $scope.tab.params.view.order.fieldId))
      $scope.setOrderField(updatedAtField);
      $scope.resetEntries(true);
  }, true);

  $scope.clearView = function () {
    $scope.tab.params.view = getBlankView();
    $scope.resetEntries(true);
  };

  $scope.loadView = function (view) {
    $scope.tab.params.view = _.cloneDeep(view);
    $scope.tab.params.view.title = 'New View';
    $scope.resetEntries(true);
  };

  $scope.orderDescription = function (view) {
    var field = _.find($scope.displayedFields, {id: view.order.fieldId});
    var direction = view.order.direction;
    return '' + direction + ' by ' + field.name;
  };

  $scope.saveViews = function () {
    return $scope.saveUiConfig().catch(function () {
      notification.serverError('Error trying to save view');
    });
  };

  $scope.getFieldList = function () {
    return _.map($scope.displayedFields, 'name').join(', ');
  };

  //TODO move to ViewMenuController
  $scope.viewIsActive = function (view){
    var p = $scope.tab.params.view;
    if (!view) view = blankView;
    return p.id === view.id;
  };

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

  }

});
