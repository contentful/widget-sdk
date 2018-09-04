'use strict';

angular.module('contentful').controller('SpaceController', [
  '$scope',
  'require',
  function SpaceController($scope, require) {
    const $rootScope = require('$rootScope');
    const authorization = require('authorization');
    const enforcements = require('access_control/Enforcements.es6');
    const spaceContext = require('spaceContext');
    const TokenStore = require('services/TokenStore.es6');

    $scope.sidePanelIsShown = false;
    $scope.toggleSidePanel = () => {
      $scope.sidePanelIsShown = !$scope.sidePanelIsShown;
      $scope.$applyAsync();
    };

    $scope.$watch(
      () => authorization.isUpdated(TokenStore.getTokenLookup(), spaceContext.space),
      () => {
        if (TokenStore.getTokenLookup()) {
          const enforcement = enforcements.getPeriodUsage(spaceContext.organization);
          if (enforcement) {
            $rootScope.$broadcast('persistentNotification', {
              message: enforcement.message,
              actionMessage: enforcement.actionMessage,
              action: enforcement.action
            });
          }
        }
      }
    );
  }
]);
