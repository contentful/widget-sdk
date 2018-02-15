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
  var spaceContext = require('spaceContext');
  var webhookRepo = require('WebhookRepository').getInstance(spaceContext.space);
  var ReloadNotification = require('ReloadNotification');
  var ResourceUtils = require('utils/ResourceUtils');
  var createResourceService = require('services/ResourceService').default;

  var organization = spaceContext.organizationContext.organization;
  var resources = createResourceService(spaceContext.getId());

  ResourceUtils.useLegacy(organization).then(function (legacy) {
    $scope.showSidebar = !legacy;
  });

  resources.get('webhookDefinition').then(function (resource) {
    $scope.usage = resource.usage;
  });

  $scope.limit = 20;

  reload().catch(ReloadNotification.basicErrorHandler);

  function reload () {
    return webhookRepo.getAll().then(function (items) {
      $scope.webhooks = items;
      $scope.context.ready = true;
    });
  }
}]);
