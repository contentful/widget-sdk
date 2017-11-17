'use strict';

angular.module('contentful')

.directive('cfWebhookList', function () {
  return {
    restrict: 'E',
    template: JST['webhook_list'](),
    controller: 'WebhookListController'
  };
})

.controller('WebhookListController', ['$scope', 'require', function ($scope, require) {

  var spaceContext       = require('spaceContext');
  var webhookRepo        = require('WebhookRepository').getInstance(spaceContext.space);
  var ReloadNotification = require('ReloadNotification');

  $scope.limit = 20;

  reload().catch(ReloadNotification.basicErrorHandler);

  function reload() {
    return webhookRepo.getAll().then(function (items) {
      $scope.webhooks = items;
      $scope.context.ready = true;
    });
  }
}]);
