'use strict';

angular.module('contentful')

.directive('cfWebhookList', function () {
  return {
    restrict: 'E',
    template: JST['webhook_list'](),
    controller: 'WebhookListController'
  };
})

.controller('WebhookListController', ['$scope', '$injector', function ($scope, $injector) {

  var spaceContext       = $injector.get('spaceContext');
  var webhookRepo        = $injector.get('WebhookRepository').getInstance(spaceContext.space);
  var ReloadNotification = $injector.get('ReloadNotification');

  reload().catch(ReloadNotification.basicErrorHandler);

  function reload() {
    return webhookRepo.getAll().then(function (items) {
      $scope.context.ready = true;
      $scope.webhooks = items;
    });
  }
}]);
