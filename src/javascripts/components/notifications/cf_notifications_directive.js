'use strict';

angular.module('contentful').directive('cfNotifications', () => ({
  restrict: 'E',
  template: JST.cf_notifications(),
  scope: true,

  controller: ['$scope', 'require', ($scope, require) => {
    var notification = require('notification');
    var $timeout = require('$timeout');

    $scope.markAsSeen = () => {
      notification.markAsSeen();
    };

    $scope.$watch(() => !notification.message || notification.message.hidden, setHidden);

    $scope.$watch(() => notification.message, setMessage);

    function setHidden (hidden) {
      $scope.hidden = hidden;
    }

    function setMessage (message) {
      $scope.message = message;
    }
  }]
}));
