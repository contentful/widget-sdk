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

  function getBlankPreset() {
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

  var blankPreset = getBlankPreset();

  $scope.tab.params.preset = $scope.tab.params.preset || getBlankPreset();

  $scope.fieldIsSortable = function (field) {
    return _.contains(SORTABLE_TYPES, field.type) && field.id !== 'author';
  };

  $scope.isOrderField = function (field) {
    return $scope.tab.params.preset.order.fieldId === field.id;
  };

  function setOrderField(field) {
    $scope.tab.params.preset.order = {
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
    $scope.tab.params.preset.order.direction = switchOrderDirection($scope.tab.params.preset.order.direction);
    $scope.resetEntries(true);
  };

  function switchOrderDirection(direction) {
    return direction === 'ascending' ? 'descending' : 'ascending';
  }

  $scope.$watch('tab.params.preset.displayedFieldIds', function (displayedFieldIds) {
    if(!_.contains(displayedFieldIds, $scope.tab.params.preset.order.fieldId))
      $scope.setOrderField(updatedAtField);
  }, true);

  $scope.openSaveView = function () {
    modalDialog.open({
      template: 'save_view_dialog',
      scope: $scope
    }).then(savePreset);
  };

  function savePreset() {
    $scope.tab.params.preset.id = random.id();
    $scope.uiConfig.entryListViews[0].views.push($scope.tab.params.preset);
    $scope.saveEntryListViews();
  }

  $scope.clearPreset = function () {
    $scope.tab.params.preset = getBlankPreset();
    $scope.resetEntries(true);
  };

  $scope.loadPreset = function (preset) {
    $scope.tab.params.preset = _.cloneDeep(preset);
    $scope.tab.params.preset.title = '' + preset.title + ' (copy)';
    $scope.resetEntries(true);
  };

  $scope.orderDescription = function (preset) {
    var field = _.find($scope.displayedFields, {id: preset.order.fieldId});
    var direction = preset.order.direction;
    return '' + direction + ' by ' + field.name;
  };

  $scope.deletePreset = function (preset) {
    modalDialog.open({
      title: 'Delete View?',
      message: 'Do you really want to delete the View "'+preset.title+'"?',
      confirmLabel: 'Delete View',
      scope: $scope
    }).then(function () {
      _.remove($scope.uiConfig.entryListViews[0].views, {id: preset.id});
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

  $scope.presetIsActive = function (preset){
    var p = $scope.tab.params.preset;
    if (!preset) preset = blankPreset;
    return p.id === preset.id;
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
