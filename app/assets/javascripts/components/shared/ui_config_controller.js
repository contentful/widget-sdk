'use strict';
angular.module('contentful').controller('UiConfigController', function($scope, sentry, random, modalDialog){
  var DEFAULT_ORDER_QUERY = 'sys.updatedAt';
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

  $scope.filteredContentType = null;
  $scope.filteredContentTypeFields = [];
  $scope.displayedFields = _.clone($scope.systemFields);

  $scope.orderQuery = DEFAULT_ORDER_QUERY;
  $scope.orderDirection = DEFAULT_ORDER_DIRECTION;
  $scope.orderField = updatedAtField;

  $scope.fieldIsSortable = function (field) {
    return _.contains(SORTABLE_TYPES, field.type);
  };

  $scope.setOrderField = function (field) {
    var fieldPath = $scope.getFieldPath(field);
    $scope.orderDirection = DEFAULT_ORDER_DIRECTION;
    $scope.orderQuery = fieldPath;
    $scope.orderField = field;
    $scope.resetEntries();
  };

  $scope.orderColumnBy = function () {
    $scope.orderDirection = switchOrderDirection($scope.orderDirection);
    $scope.resetEntries();
  };

  function switchOrderDirection(direction) {
    return {
      'ascending': 'descending',
      'descending': 'ascending'
    }[direction];
  }

  $scope.openSaveView = function () {
    $scope.uiConfigLoadedPreset = $scope.uiConfigLoadedPreset || {title: '', id: random.id()};
    modalDialog.open({
      template: 'save_view_dialog',
      scope: $scope
    }).then(saveView);
  };

  function saveView() {
    var preset = $scope.uiConfigLoadedPreset;
    if($scope.searchTerm) preset.searchTerm = $scope.searchTerm;
    if($scope.tab.params.contentTypeId){
      preset.contentTypeId = $scope.tab.params.contentTypeId;
      preset.displayedFields = $scope.displayedFields;
    }
    preset.order = {
      field: {
        id: $scope.orderField.id,
        sys: $scope.orderField.sys
      },
      direction: $scope.orderDirection
    };
    var presetIndex = _.findIndex($scope.uiConfig.savedPresets, function (val) { return val.id === preset.id;});
    if(presetIndex >= 0){
      $scope.uiConfig.savedPresets[presetIndex] = preset;
    } else {
      $scope.uiConfig.savedPresets.push(preset);
    }
    $scope.uiConfigLoadedPreset = preset;
    $scope.spaceContext.space.setUIConfig($scope.uiConfig, function (err, config) {
      //if(err && err.body.sys.id == 'VersionMismatch')
      // Handle version mismatch
      // maybe get config again, and inject new preset or look for preset and update it in case order was changed
      $scope.uiConfig = config;
    });
  }

  $scope.loadPreset = function (preset) {
    $scope.searchTerm = preset.searchTerm || null;
    if(preset.contentTypeId) {
      $scope.tab.params.contentTypeId = preset.contentTypeId;
      $scope.displayedFields = preset.displayedFields;
    }
    $scope.orderDirection = preset.order.direction;
    $scope.orderField = preset.order.field;
    $scope.orderQuery = $scope.getFieldPath(preset.order.field);
    $scope.uiConfigLoadedPreset = preset;
    $scope.resetEntries();
  };

  $scope.getFieldList = function () {
    return _.map($scope.displayedFields, 'name').join(', ');
  };

  $scope.getFieldClass = function (field) {
    return 'cell-'+field.type.toLowerCase();
  };

  $scope.getFieldPath = function (field) {
    if(field.sys){
      return 'sys.'+field.id;
    }
    var defaultLocale = $scope.spaceContext.space.getDefaultLocale().code;
    return 'fields.'+field.id+'.'+defaultLocale;
  };

  
  loadUIConfig();

  function loadUIConfig() {
    // TODO ugh, this is wrong because uiConfig is of a higher scope than entrylistController
    $scope.spaceContext.space.getUIConfig(function (err, config) {
      if (!err) {
        if(config && config.savedPresets)
          $scope.uiConfig = config;
        else
          $scope.uiConfig = {savedPresets: generateDefaultViews()};
      } else {
        $scope.uiConfig = {savedPresets: generateDefaultViews()};
        sentry.captureServerError('Could not load UIConfig', err);
      }
    });
  }

  function generateDefaultViews() {
    var views = [ { title: 'All', id: random.id(), order: makeOrder()} ];
    views.push(
      {title: 'Status: Published', searchTerm: 'status:published', id: random.id(), order: makeOrder()},
      {title: 'Status: Changed',   searchTerm: 'status:changed'  , id: random.id(), order: makeOrder()},
      {title: 'Status: Draft',     searchTerm: 'status:draft'    , id: random.id(), order: makeOrder()},
      {title: 'Status: Archived',  searchTerm: 'status:archived' , id: random.id(), order: makeOrder()}
    );
    $scope.waitFor('spaceContext.publishedContentTypes.length > 0', function () {
      _.each($scope.spaceContext.publishedContentTypes, function (contentType) {
        views.push({
          title: 'Content Type: '+contentType.data.name,
          contentTypeId: contentType.getId(),
          id: random.id(),
          order: makeOrder()
        });
    });

    });
    return views;

    function makeOrder() {
      return { field: updatedAtField, direction: DEFAULT_ORDER_DIRECTION };
    }
  }

});
