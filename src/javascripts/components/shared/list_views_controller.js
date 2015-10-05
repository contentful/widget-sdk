'use strict';
angular.module('contentful').controller('ListViewsController', [
'$scope', '$injector', 'generateDefaultViews', 'getBlankView', 'resetList', 'viewCollectionName', 'preserveStateAs',
function ($scope, $injector, generateDefaultViews, getBlankView, resetList, viewCollectionName, preserveStateAs) {
  var $q           = $injector.get('$q');
  var logger       = $injector.get('logger');
  var notification = $injector.get('notification');
  var $parse       = $injector.get('$parse');
  var FilterQS     = $injector.get('FilterQueryString');

  var getCurrentView = $parse('context.view');
  var setCurrentView = getCurrentView.assign;

  if (preserveStateAs) {
    var qs = FilterQS.create(preserveStateAs);
    replaceView(qs.readView());
    $scope.$watch('context.view', qs.update, true);
  }

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
    replaceView(view);
    resetList();
  };

  $scope.saveViews = function () {
    return $scope.saveUiConfig().catch(function (err) {
      logger.logServerWarn('Error trying to save view', {error: err });
      notification.error('Error trying to save view');
      return $q.reject(err);
    });
  };

  function replaceView(view) {
    var newView = _.extend(getBlankView(), _.cloneDeep(view));
    newView.title = 'New View';
    setCurrentView($scope, newView);
  }
}]);
