'use strict';

angular.module('contentful')
.controller('SpaceController', ['$scope', 'require', function SpaceController ($scope, require) {
  var $rootScope = require('$rootScope');
  var authorization = require('authorization');
  var enforcements = require('access_control/Enforcements');
  var spaceContext = require('spaceContext');
  var TokenStore = require('services/TokenStore');

  $scope.sidePanelIsShown = false;
  $scope.toggleSidePanel = () => {
    $scope.sidePanelIsShown = !$scope.sidePanelIsShown;
  };

  $scope.$watch(() => authorization.isUpdated(TokenStore.getTokenLookup(), spaceContext.space), () => {
    if (TokenStore.getTokenLookup()) {
      var enforcement = enforcements.getPeriodUsage(spaceContext.organization);
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
