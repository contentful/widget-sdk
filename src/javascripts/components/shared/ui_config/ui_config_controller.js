'use strict';
angular.module('contentful')
.controller('UiConfigController', ['$scope', '$injector', function ($scope, $injector) {

  var $q = $injector.get('$q');
  var uiConfig = $injector.get('uiConfig');
  var spaceContext = $injector.get('spaceContext');

  $scope.$watch(function () {
    return spaceContext.space;
  }, function (space) {
    if (space) {
      loadUiConfig();
    } else {
      $scope.uiConfig = null;
    }
  });

  $scope.$watch(function () {
    return uiConfig.get();
  }, function (config) {
    if (dotty.get(config, 'sys.version') > dotty.get($scope.uiConfig, 'sys.version')) {
      $scope.uiConfig = config;
    }
  });

  $scope.$watch(function () {
    var user = spaceContext.getData('spaceMembership.user');
    return spaceContext.space && spaceContext.space.isAdmin(user);
  }, function (can) {
    $scope.canEditUiConfig = !!can;
  });

  $scope.saveUiConfig = function () {
    if (!$scope.canEditUiConfig) {
      return $q.reject('Not allowed');
    }

    // TODO client-side verification
    return uiConfig.save($scope.uiConfig)
    .then(function (config) {
      $scope.uiConfig = config;
    })
    .catch(function () {
      loadUiConfig();
    });
  };

  function loadUiConfig () {
    uiConfig.load()
    .then(function (config) {
      $scope.uiConfig = config;
    });
  }

}]);
