'use strict';
angular.module('contentful').controller('UiConfigController', ['$scope', '$q', 'notification', 'logger', function($scope, $q, notification, logger){

  $scope.$watch('spaceContext.space', function (space) {
    $scope.uiConfig = null;
    if (space) loadUiConfig();
  });

  $scope.$watch('spaceContext.space.isAdmin(user)', function (can, old, scope) {
    scope.canEditUiConfig = !!can;
  });

  $scope.saveUiConfig = function() {
    if (!$scope.canEditUiConfig) return $q.reject('Not allowed');
    // TODO client-side verification
    return $scope.spaceContext.space.setUIConfig($scope.uiConfig)
    .then(function (config) {
      $scope.uiConfig = config;
      return $scope.uiConfig;
    }, function () {
      loadUiConfig();
    });
  };

  function loadUiConfig() {
    return $scope.spaceContext.space.getUIConfig()
    .then(function (config) {
      $scope.uiConfig = config;
      return config;
    }, function (err) {
      var statusCode = dotty.get(err, 'statusCode');
      if(statusCode === 404) {
        $scope.uiConfig = {};
        return $scope.uiConfig;
      } else if(statusCode !== 502) {
        logger.logServerError('Could not load UIConfig', {error: err});
      }
    });
  }

}]);
