'use strict';

angular.module('contentful').directive('cfWebhookHealth', [function () {

  var THRESHOLD = {WARN: 70, OK: 90};

  return {
    restrict: 'E',
    template: JST['webhook_health'](),
    scope: {webhookId: '='},
    controller: ['$scope', 'spaceContext', function ($scope, spaceContext) {
      var endpoint = spaceContext.space.endpoint('webhooks/' + $scope.webhookId + '/health');
      $scope.status = 'loading';

      endpoint.get().then(function (data) {
        var percentage = Math.round(data.calls.healthy/data.calls.total*100);

        if (_.isNumber(percentage) && percentage >= 0 && percentage <= 100) {
          var cssClass      = percentage > THRESHOLD.WARN ? 'x--warn' : 'x--fail';
          $scope.cssClass   = percentage > THRESHOLD.OK   ? 'x--ok'   : cssClass;
          $scope.percentage = percentage;
          $scope.status     = 'ready';
        } else { noData(); }
      }, noData);

      function noData() { $scope.status = 'nodata'; }
    }]
  };
}]);
