'use strict';
angular.module('contentful').controller('UiConfigController', ['$scope', '$q', 'notification', 'sentry', function($scope, $q, notification, sentry){

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
    var callback = $q.callback();
    $scope.spaceContext.space.setUIConfig($scope.uiConfig, callback);
    callback.promise.then(function (config) {
      $scope.uiConfig = config;
      return $scope.uiConfig;
    }, function () {
      loadUiConfig();
    });
    return callback.promise;
  };
  
  function loadUiConfig() {
    var callback = $q.callback();
    $scope.spaceContext.space.getUIConfig(callback);
    callback.promise.then(function (config) {
      $scope.uiConfig = config;
      return config;
    }, function (err) {
      if(err && err.statusCode === 404) {
        $scope.uiConfig = {};
        return $scope.uiConfig;
      } else {
        sentry.captureServerError('Could not load UIConfig', err);
      }
    });
    return callback.promise;
  }

}]);
