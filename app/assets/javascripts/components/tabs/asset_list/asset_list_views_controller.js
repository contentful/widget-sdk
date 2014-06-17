'use strict';
angular.module('contentful').controller('AssetListViewsController', function($scope, sentry, random, modalDialog, notification, mimetype){
  function getBlankView() {
    return {
      id: null,
      title: 'New View',
      searchTerm: null
    };
  }

  $scope.$watch('uiConfig', function (uiConfig) {
    if (uiConfig && !uiConfig.assetListViews) {
      uiConfig.assetListViews = generateDefaultViews();
    }
  });

  var blankView = getBlankView();

  $scope.tab.params.view = $scope.tab.params.view || getBlankView();

  $scope.resetViews = function () {
    $scope.uiConfig.assetListViews = generateDefaultViews();
    $scope.saveViews();
  };

  $scope.clearView = function () {
    $scope.tab.params.view = getBlankView();
    $scope.resetAssets(true);
  };

  $scope.loadView = function (view) {
    $scope.tab.params.view = _.cloneDeep(view);
    $scope.tab.params.view.title = 'New View';
    $scope.resetAssets(true);
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

  function generateDefaultViews() {
    return [
      {
        id: 'default',
        title: 'Views',
        views: [{
          id: random.id(),
          title: 'All'
        }]
      },
      {
        id: random.id(),
        title: 'Status',
        views: [
          {title: 'Published', searchTerm: 'status:published', id: random.id()},
          {title: 'Changed',   searchTerm: 'status:changed'  , id: random.id()},
          {title: 'Draft',     searchTerm: 'status:draft'    , id: random.id()},
          {title: 'Archived',  searchTerm: 'status:archived' , id: random.id()}
        ]
      },
      {
        id: random.id(),
        title: 'File Type',
        views: fileTypeViews()
      }
    ];

    function fileTypeViews() {
      return _.map(mimetype.groupDisplayNames, function (name, label) {
        return {
          title: name,
          searchTerm: 'type:'+label,
          id: random.id()
        };
      });
    }

  }

});
