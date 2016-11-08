'use strict';

angular.module('contentful')
.controller('SpaceController', ['$scope', 'require', function SpaceController ($scope, require) {
  var $controller = require('$controller');
  var $rootScope = require('$rootScope');
  var analytics = require('analytics');
  var authentication = require('authentication');
  var authorization = require('authorization');
  var enforcements = require('enforcements');
  var spaceContext = require('spaceContext');

  $controller('UiConfigController', {$scope: $scope});
  // TODO: it's not a controller, it should be a service
  $scope.entityCreationController = $controller('EntityCreationController');

  $scope.$watch(function () {
    return authorization.isUpdated(authentication.tokenLookup, spaceContext.space) && authentication.tokenLookup;
  }, function (updated) {
    if (updated) {
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

  $scope.logoClicked = _.partial(analytics.track, 'global:logo_clicked');
}]);
