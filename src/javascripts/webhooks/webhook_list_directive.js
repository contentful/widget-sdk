'use strict';

angular.module('contentful')

.directive('cfWebhookList', () => ({
  restrict: 'E',
  template: JST['webhook_list'](),
  controller: 'WebhookListController'
}))

.controller('WebhookListController', ['$scope', 'require', ($scope, require) => {
  var spaceContext = require('spaceContext');
  var webhookRepo = require('WebhookRepository').getInstance(spaceContext.space);
  var ReloadNotification = require('ReloadNotification');
  var ResourceUtils = require('utils/ResourceUtils');
  var createResourceService = require('services/ResourceService').default;

  var organization = spaceContext.organizationContext.organization;
  var resources = createResourceService(spaceContext.getId());

  ResourceUtils.useLegacy(organization).then(legacy => {
    $scope.showSidebar = !legacy;
  });

  resources.get('webhookDefinition').then(resource => {
    $scope.usage = resource.usage;
    $scope.limit = ResourceUtils.getResourceLimits(resource).maximum;

    // Get the usage and limits first, then load the Webhook Definitions
    reload().catch(ReloadNotification.basicErrorHandler);
  });

  function reload () {
    return webhookRepo.getAll().then(items => {
      // Currently, for Version 1 organizations, the usage comes
      // from the token, but this is unreliable as the token is
      // cached. We instead look at the length of the webhooks to
      // show its usage.

      if (ResourceUtils.isLegacyOrganization(organization)) {
        $scope.usage = items.length;
      }

      $scope.webhooks = items;
      $scope.context.ready = true;
    });
  }
}]);
