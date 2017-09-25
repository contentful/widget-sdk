'use strict';

angular.module('contentful')
.controller('SpaceController', ['$scope', 'require', function SpaceController ($scope, require) {
  var $controller = require('$controller');
  var $rootScope = require('$rootScope');
  var authorization = require('authorization');
  var enforcements = require('enforcements');
  var spaceContext = require('spaceContext');
  var tokenStore = require('services/TokenStore');

  // TODO: it's not a controller, it should be a service
  $scope.entityCreationController = $controller('EntityCreationController');

  $scope.$watch(function () {
    return authorization.isUpdated(tokenStore.getTokenLookup(), spaceContext.space);
  }, function () {
    if (tokenStore.getTokenLookup()) {
      var enforcement = enforcements.getPeriodUsage();
      if (enforcement) {
        $rootScope.$broadcast('persistentNotification', {
          message: enforcement.message,
          actionMessage: enforcement.actionMessage,
          action: enforcement.action
        });
      }
    }
  });

}]);
