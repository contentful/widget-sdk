'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/webhooks
 */

.factory('states/settings/webhooks', ['$injector', function ($injector) {
  var base = $injector.get('states/base');

  var list = base({
    name: 'list',
    url: '',
    ncyBreadcrumb: { label: 'Webhooks' },
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
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.webhooks.list',
      label: '{{ context.title + (context.dirty ? "*" : "") }}'
    },
    template: '<cf-webhook-editor cf-ui-tab class="workbench webhook-editor" />',
    controller: ['$scope', '$state', function ($scope, $state) {
      $scope.context = $state.current.data;
      $scope.webhook = {headers: []};
    }]
  };

  var call = {
    name: 'call',
    url: '/call/:callId',
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.webhooks.detail',
      label: 'Call details ({{ call.requestAt }})'
    },
    resolve: {
      call: ['WebhookRepository', 'space', 'webhook', '$stateParams', function (WebhookRepository, space, webhook, $stateParams) {
        return WebhookRepository.getInstance(space).logs.getCall(webhook.sys.id, $stateParams.callId);
      }]
    },
    views: {
      '@spaces.detail.settings.webhooks': {
        template: JST['webhook_call'](),
        controller: ['$scope', '$stateParams', 'webhook', 'call', function ($scope, $stateParams, webhook, call) {
          $scope.call = call;
          $scope.webhook = webhook;
          $scope.context = {parentTitle: webhook.name};

          try {
            $scope.body = JSON.parse($scope.call.request.body);
            $scope.call.request = _.omit($scope.call.request, ['body']);
          } catch (e) {}
        }]
      }
    }
  };

  var detail = {
    name: 'detail',
    url: '/:webhookId',
    data: {
      isNew: false
    },
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.webhooks.list',
      label: '{{ context.parentTitle || (context.title + (context.dirty ? "*" : "")) }}'
    },
    resolve: {
      webhook: ['WebhookRepository', 'space', '$stateParams', function (WebhookRepository, space, $stateParams) {
        return WebhookRepository.getInstance(space).get($stateParams.webhookId);
      }]
    },
    template: '<cf-webhook-editor cf-ui-tab class="workbench webhook-editor" />',
    controller: ['$scope', '$state', 'webhook', function ($scope, $state, webhook) {
      $scope.context = $state.current.data;
      $scope.webhook = webhook;
    }],
    children: [call]
  };

  return {
    name: 'webhooks',
    url: '/webhooks',
    abstract: true,
    template: '<ui-view />',
    onEnter: ['analytics', function (analytics) {
      analytics.track('Opened Webhooks view');
    }],
    children: [list, newWebhook, detail]
  };
}]);
