'use strict';

angular.module('contentful').directive('cfWebhookCallStatus', [function () {

  var ERROR_NAMES = {
    TimeoutError: 'Timeout',
    ConnectionResetError: 'Connection reset',
    HostUnreachableError: 'Host unreachable',
    ProtocolError: 'Invalid protocol'
  };

  return {
    restrict: 'E',
    template: JST['webhook_call_status'](),
    scope: {call: '='},
    controller: ['$scope', function ($scope) {
      var code = dotty.get($scope, 'call.statusCode');
      var hasStatusCode = _.isNumber(code);
      $scope.cssClass = 'x--fail';

      if (hasStatusCode) {
        if (code < 300) {
          $scope.cssClass = 'x--ok';
        } else if (code < 400) {
          $scope.cssClass = 'x--warn';
        }
      } else {
        var errorName = _.first(dotty.get($scope, 'call.errors', []));
        if (errorName) {
          $scope.error = ERROR_NAMES[errorName];
        }
      }
    }]
  };
}]);
