'use strict';

angular.module('contentful').directive('cfWebhookList', function () {
  return {
    restrict: 'E',
    template: JST['webhook_list'](),
    controller: 'WebhookListController'
  };
});

angular.module('contentful').controller('WebhookListController', ['$scope', '$injector', function ($scope, $injector) {

  var $timeout = $injector.get('$timeout');

  $timeout(function () {
    $scope.context.ready = true;
  }, 750);

}]);
