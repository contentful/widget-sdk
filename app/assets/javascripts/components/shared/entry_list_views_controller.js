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

  function getBlankView() {
    return {
      title: null,
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

  $scope.$watch('uiConfig', function (uiConfig) {
    if (uiConfig && !uiConfig.entryListViews) {
      uiConfig.entryListViews = generateDefaultViews();
    }
  });

  var blankView = getBlankView();

  $scope.tab.params.view = $scope.tab.params.view || getBlankView();

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

  $scope.setOrderField = function (field) {
    setOrderField(field);
    $scope.resetEntries(true);
  };

  $scope.orderColumnBy = function (field) {
    if(!$scope.isOrderField(field)) setOrderField(field);
    $scope.tab.params.view.order.direction = switchOrderDirection($scope.tab.params.view.order.direction);
    $scope.resetEntries(true);
  };

  function switchOrderDirection(direction) {
    return direction === 'ascending' ? 'descending' : 'ascending';
  }

  $scope.$watch('tab.params.view.displayedFieldIds', function (displayedFieldIds) {
    if(!_.contains(displayedFieldIds, $scope.tab.params.view.order.fieldId))
      $scope.setOrderField(updatedAtField);
  }, true);

  $scope.openSaveView = function () {
    modalDialog.open({
      template: 'save_view_dialog',
      scope: $scope
    }).then(saveView);
  };

  function saveView() {
    $scope.tab.params.view.id = random.id();
    $scope.uiConfig.entryListViews[0].views.push($scope.tab.params.view);
    $scope.saveEntryListViews();
  }

  $scope.clearView = function () {
    $scope.tab.params.view = getBlankView();
    $scope.resetEntries(true);
  };

  $scope.loadView = function (view) {
    $scope.tab.params.view = _.cloneDeep(view);
    $scope.tab.params.view.title = '' + view.title + ' (copy)';
    $scope.resetEntries(true);
  };

  $scope.orderDescription = function (view) {
    var field = _.find($scope.displayedFields, {id: view.order.fieldId});
    var direction = view.order.direction;
    return '' + direction + ' by ' + field.name;
  };

  $scope.deleteView = function (view) {
    modalDialog.open({
      title: 'Delete View?',
      message: 'Do you really want to delete the View "'+view.title+'"?',
      confirmLabel: 'Delete View',
      scope: $scope
    }).then(function () {
      _.remove($scope.uiConfig.entryListViews[0].views, {id: view.id});
      return $scope.saveEntryListViews();
    });
  };

  $scope.saveEntryListViews = function () {
    return $scope.saveUiConfig().catch(function () {
      notification.serverError('Error trying to save view');
    });
  };

  $scope.getFieldList = function () {
    return _.map($scope.displayedFields, 'name').join(', ');
  };

  $scope.viewIsActive = function (view){
    var p = $scope.tab.params.view;
    if (!view) view = blankView;
    return p.id === view.id;
  };

  function generateDefaultViews() {
    var views = [];
    views.push(
      {title: 'Status: Published', searchTerm: 'status:published', id: random.id(), order: makeOrder(), displayedFieldIds: fieldIds()},
      {title: 'Status: Changed',   searchTerm: 'status:changed'  , id: random.id(), order: makeOrder(), displayedFieldIds: fieldIds()},
      {title: 'Status: Draft',     searchTerm: 'status:draft'    , id: random.id(), order: makeOrder(), displayedFieldIds: fieldIds()},
      {title: 'Status: Archived',  searchTerm: 'status:archived' , id: random.id(), order: makeOrder(), displayedFieldIds: fieldIds()}
    );
    $scope.waitFor('spaceContext.publishedContentTypes.length > 0', function () {
      _.each($scope.spaceContext.publishedContentTypes, function (contentType) {
        views.push({
          title: 'Content Type: '+contentType.data.name,
          contentTypeId: contentType.getId(),
          id: random.id(),
          order: makeOrder(),
          displayedFieldIds: fieldIds()
        });
      });
    });
    return [{
      id: random.id(),
      title: 'Saved Views',
      views: views
    }];

    function makeOrder() {
      return { fieldId: updatedAtField.id, direction: DEFAULT_ORDER_DIRECTION };
    }

    function fieldIds() {
      return _.map($scope.systemFields, 'id');
    }
  }

});
