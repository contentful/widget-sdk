'use strict';
angular.module('contentful').controller('ListViewsController',
    ['$scope', 'modalDialog', 'notification', '$q', 'getBlankView', 'viewCollectionName', 'generateDefaultViews', 'resetList',
      function($scope, modalDialog, notification, $q, getBlankView, viewCollectionName, generateDefaultViews, resetList){
  $scope.tab.params.view = $scope.tab.params.view || getBlankView();

  $scope.$watch('uiConfig', function (uiConfig) {
    if (uiConfig && !uiConfig[viewCollectionName]) {
      uiConfig[viewCollectionName] = generateDefaultViews(true);
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
}]);
