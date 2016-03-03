'use strict';

angular.module('contentful').directive('cfWebhookCallStatus', [function () {

  var ERROR_NAMES = {
    TimeoutError: 'Timeout',
    ConnectionResetError: 'Connection reset',
    HostUnreachableError: 'Host unreachable',
    ProtocolError: 'Invalid protocol'
  };

  var CLASSES = {
    OK: 'x--ok',
    WARN: 'x--warn',
    FAIL: 'x--fail'
  };

  return {
    restrict: 'E',
    template: JST['webhook_call_status'](),
    scope: {call: '='},
    controller: ['$scope', function ($scope) {
      var code = dotty.get($scope, 'call.statusCode');
      var hasStatusCode = _.isNumber(code);
      $scope.cssClass = CLASSES.FAIL;

      if (hasStatusCode) {
        if (code < 300) {
          $scope.cssClass = CLASSES.OK;
        } else if (code < 400) {
          $scope.cssClass = CLASSES.WARN;
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
