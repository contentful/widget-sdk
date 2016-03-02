'use strict';

angular.module('contentful').directive('cfWebhookCall', function () {
  return {
    restrict: 'E',
    template: JST['webhook_call'](),
    controller: ['$scope', function ($scope) {
      try {
        $scope.body = JSON.parse($scope.call.request.body);
        $scope.call.request = _.omit($scope.call.request, ['body']);
      } catch (e) {}
    }]
  };
});
