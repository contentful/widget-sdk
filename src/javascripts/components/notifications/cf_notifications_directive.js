'use strict';

angular.module('contentful').directive('cfNotifications', function() {
  return {
    restrict: 'E',
    template: JST.cf_notifications(),
    scope: true,
    controller: ['$scope', 'require', function ($scope, require) {
      var notification = require('notification');
      var $timeout = require('$timeout');

      $scope.markAsSeen = function () {
        notification.markAsSeen();
      };

      $scope.$watch(function () {
        return !notification.message || notification.message.hidden;
      }, setHidden);

      $scope.$watch(function () {
        return notification.message;
      }, setMessage);

      function setHidden (hidden) {
        $scope.hidden = hidden;
      }

      function setMessage (message) {
        $scope.message = message;
      }
    }]
  };
});
