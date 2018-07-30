'use strict';

angular.module('contentful').directive('cfWebhookHealth', [() => {
  var THRESHOLD = {WARN: 70, OK: 90};

  return {
    restrict: 'E',
    template: JST['webhook_health'](),
    scope: {webhookId: '='},
    controller: ['$scope', 'spaceContext', ($scope, spaceContext) => {
      $scope.state = 'loading';

      spaceContext.webhookRepo.logs.getHealth($scope.webhookId).then(data => {
        var percentage = Math.round(data.calls.healthy / data.calls.total * 100);

        if (_.isNumber(percentage) && percentage >= 0 && percentage <= 100) {
          var status = percentage > THRESHOLD.WARN ? 'warning' : 'failure';
          $scope.status = percentage > THRESHOLD.OK ? 'success' : status;
          $scope.percentage = percentage;
          $scope.state = 'ready';
        } else { noData(); }
      }, noData);

      function noData () { $scope.state = 'nodata'; }
    }]
  };
}]);
