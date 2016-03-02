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
    template: '<cf-webhook-editor class="workbench webhook-editor" />',
    controller: ['$scope', '$state', function ($scope, $state) {
      $scope.context = $state.current.data;
      $scope.webhook = {};
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
      call: ['space', 'webhook', '$stateParams', function (space, webhook, $stateParams) {
        var path = 'webhooks/' + webhook.sys.id + '/calls/' + $stateParams.callId;
        return space.endpoint(path).get();
      }]
    },
    views: {
      '@spaces.detail.settings.webhooks': {
        template: '<cf-webhook-call class="workbench webhook-call" />',
        controller: ['$scope', '$stateParams', 'webhook', 'call', function ($scope, $stateParams, webhook, call) {
          $scope.call = call;
          $scope.context = {parentTitle: webhook.url};
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
      label: '{{ context.title + (context.dirty ? "*" : "") }}'
    },
    resolve: {
      webhook: ['WebhookRepository', 'space', '$stateParams', function (WebhookRepository, space, $stateParams) {
        return WebhookRepository.getInstance(space).get($stateParams.webhookId);
      }]
    },
    template: '<cf-webhook-editor class="workbench webhook-editor" />',
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
