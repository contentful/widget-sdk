'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/webhooks
 */

.factory('states/settings/webhooks', ['require', function (require) {
  var base = require('states/base');
  var contextHistory = require('contextHistory');
  var crumbFactory = require('navigation/CrumbFactory');

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading Webhooks...',
    template: '<cf-webhook-list class="workbench webhook-list" />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  });

  var newWebhook = {
    name: 'new',
    url: '/new',
    data: {
      isNew: true
    },
    template: '<cf-webhook-editor cf-ui-tab class="workbench webhook-editor" />',
    controller: ['$scope', 'require', function ($scope, require) {
      var $state = require('$state');

      $scope.context = $state.current.data;
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
      call: ['WebhookRepository', 'spaceContext', 'webhook', '$stateParams', function (WebhookRepository, spaceContext, webhook, $stateParams) {
        return WebhookRepository.getInstance(spaceContext.space).logs.getCall(webhook.sys.id, $stateParams.callId);
      }]
    },
    template: JST['webhook_call'](),
    controller: ['$scope', '$stateParams', 'webhook', 'call', function ($scope, $stateParams, webhook, call) {
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
    data: {
      isNew: false
    },
    resolve: {
      webhook: ['WebhookRepository', 'spaceContext', '$stateParams', function (WebhookRepository, spaceContext, $stateParams) {
        return WebhookRepository.getInstance(spaceContext.space).get($stateParams.webhookId);
      }]
    },
    template: '<cf-webhook-editor cf-ui-tab class="workbench webhook-editor" />',
    controller: ['$scope', '$state', '$stateParams', 'webhook', function ($scope, $state, $stateParams, webhook) {
      $scope.context = $state.current.data;
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
