'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/webhooks
 */

.factory('states/settings/webhooks', ['require', require => {
  var base = require('states/Base').default;
  var contextHistory = require('navigation/Breadcrumbs/History').default;
  var crumbFactory = require('navigation/Breadcrumbs/Factory');

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading Webhooks…',
    template: '<cf-webhook-list class="workbench webhook-list" />'
  });

  var newWebhook = {
    name: 'new',
    url: '/new',
    template: '<cf-webhook-editor cf-ui-tab class="workbench webhook-editor" />',
    controller: ['$scope', $scope => {
      $scope.context.isNew = true;
      $scope.webhook = { headers: [], topics: ['*.*'] };

      contextHistory.set([
        crumbFactory.WebhookList(),
        crumbFactory.Webhook(null, $scope.context)
      ]);
    }]
  };

  var callState = {
    name: 'call',
    url: '/call/:callId',
    resolve: {
      call: ['spaceContext', 'webhook', '$stateParams', (spaceContext, webhook, $stateParams) => {
        return spaceContext.webhookRepo.logs.getCall(webhook.sys.id, $stateParams.callId);
      }]
    },
    template: JST['webhook_call'](),
    controller: ['$scope', '$stateParams', 'webhook', 'call', ($scope, $stateParams, webhook, call) => {
      $scope.webhook = webhook;
      $scope.call = call;

      try {
        $scope.body = JSON.parse($scope.call.request.body);
        $scope.call.request = _.omit($scope.call.request, ['body']);
      } catch (e) {
        /* eslint no-empty: off */
      }

      contextHistory.set([
        crumbFactory.WebhookList(),
        crumbFactory.Webhook($stateParams.webhookId, {title: webhook.name}),
        crumbFactory.WebhookCall(call)
      ]);
    }]
  };

  var detail = {
    name: 'detail',
    url: '/:webhookId',
    resolve: {
      webhook: ['spaceContext', '$stateParams', (spaceContext, $stateParams) => {
        return spaceContext.webhookRepo.get($stateParams.webhookId);
      }]
    },
    template: '<cf-webhook-editor cf-ui-tab class="workbench webhook-editor" />',
    controller: ['$scope', '$stateParams', 'webhook', ($scope, $stateParams, webhook) => {
      $scope.context.isNew = false;
      $scope.webhook = webhook;

      contextHistory.set([
        crumbFactory.WebhookList(),
        crumbFactory.Webhook($stateParams.webhookId, $scope.context)
      ]);
    }],
    children: [callState]
  };

  return {
    name: 'webhooks',
    url: '/webhooks',
    abstract: true,
    children: [list, newWebhook, detail]
  };
}]);
