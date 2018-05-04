'use strict';

angular.module('contentful').directive('cfWebhookCallStatus', [function () {
  var ERROR_NAMES = {
    TimeoutError: 'Timeout',
    ConnectionResetError: 'Connection reset',
    HostUnreachableError: 'Host unreachable',
    ProtocolError: 'Invalid protocol',
    IPForbiddenError: 'Forbidden IP address',
    NameResolutionError: 'Name unresolvable'
  };

  return {
    restrict: 'E',
    template: JST['webhook_call_status'](),
    scope: {call: '='},
    controller: ['$scope', function ($scope) {
      var code = $scope.call.statusCode;
      var hasStatusCode = _.isNumber(code);
      var errorName = _.first($scope.call.errors || []);

      $scope.status = 'failure';
      if (hasStatusCode && code < 300) {
        $scope.status = 'success';
      } else if (hasStatusCode && code < 400) {
        $scope.status = 'warning';
      } else if (errorName) {
        $scope.error = ERROR_NAMES[errorName];
      }
    }]
  };
}]);
