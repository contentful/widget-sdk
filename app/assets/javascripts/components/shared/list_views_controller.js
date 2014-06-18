'use strict';
angular.module('contentful').controller('ListViewsController', function($scope, modalDialog, notification, $q,
                                                                       getBlankView, viewCollectionName, generateDefaultViews, resetList){
  var blankView = getBlankView();

  $scope.tab.params.view = $scope.tab.params.view || getBlankView();

  $scope.$watch('uiConfig', function (uiConfig) {
    if (uiConfig && !uiConfig[viewCollectionName]) {
      uiConfig[viewCollectionName] = generateDefaultViews();
    }
  });

  $scope.resetViews = function () {
    $scope.uiConfig[viewCollectionName] = generateDefaultViews();
    $scope.saveViews();
  };

  $scope.clearView = function () {
    $scope.tab.params.view = getBlankView();
    resetList();
  };

  $scope.loadView = function (view) {
    $scope.tab.params.view = _.cloneDeep(view);
    $scope.tab.params.view.title = 'New View';
    resetList();
  };

  $scope.saveViews = function () {
    return $scope.saveUiConfig().catch(function () {
      notification.serverError('Error trying to save view');
      return $q.reject();
    });
  };

  $scope.viewIsActive = function (view){
    var p = $scope.tab.params.view;
    if (!view) view = blankView;
    return p.id === view.id;
  };
});
