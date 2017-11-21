'use strict';

angular.module('contentful').directive('cfNotifications', function() {
  return {
    restrict: 'E',
    template: JST.cf_notifications(),
    scope: true,
    controller: ['$scope', 'require', function ($scope, require) {
      var notification = require('notification');
      var $timeout = require('$timeout');

      $scope.$watch(function () {
        return notification.message;
      }, setMessage);

      function setMessage(message) {
        if ($scope.message) {
          $scope.message = null;
          $timeout(function () {
            $scope.message = message;
          });
        } else {
          $scope.message = message;
        }
      }

      $scope.clear = function () {
        notification.clear();
      };
    }]
  };
});

