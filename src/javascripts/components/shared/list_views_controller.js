'use strict';
angular.module('contentful').controller('ListViewsController', [
'$scope', '$injector', 'generateDefaultViews', 'getBlankView', 'resetList', 'viewCollectionName', 'currentViewLocation',
function($scope, $injector, generateDefaultViews, getBlankView, resetList, viewCollectionName, currentViewLocation){
  var $q           = $injector.get('$q');
  var logger       = $injector.get('logger');
  var notification = $injector.get('notification');
  var $parse       = $injector.get('$parse');

  var getCurrentView = $parse(currentViewLocation);
  var setCurrentView = getCurrentView.assign;

  setCurrentView($scope, getCurrentView($scope) || getBlankView());

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
    setCurrentView($scope, getBlankView());
    resetList();
  };

  $scope.loadView = function (view) {
    var newView;
    newView = _.cloneDeep(view);
    newView.title = 'New View';
    setCurrentView($scope, newView);
    resetList();
  };

  $scope.saveViews = function () {
    return $scope.saveUiConfig().catch(function (err) {
      logger.logServerWarn('Error trying to save view', {error: err });
      notification.error('Error trying to save view');
      return $q.reject(err);
    });
  };
}]);
