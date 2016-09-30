'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/webhooks
 */

.factory('states/settings/webhooks', ['require', function (require) {
  var base = require('states/base');
  var contextHistory = require('contextHistory');

  var listEntity = {
    getTitle: _.constant('Webhooks'),
    link: { state: 'spaces.detail.settings.webhooks.list' },
    getType: _.constant('Webhooks'),
    getId: _.constant('WEBHOOKS')
  };

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading Webhooks...',
    template: '<cf-webhook-list class="workbench webhook-list" />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
      contextHistory.addEntity(listEntity);
    }]
  });

  var newWebhook = {
    name: 'new',
    url: '/new',
    data: {
      isNew: true
    },
    params: { addToContext: true },
    template: '<cf-webhook-editor cf-ui-tab class="workbench webhook-editor" />',
    controller: ['$scope', 'require', function ($scope, require) {
      var $state = require('$state');

      $scope.context = $state.current.data;
      $scope.webhook = { headers: [], topics: ['*.*'] };

      // add list as parent state
      contextHistory.addEntity(listEntity);

      // add current state
      contextHistory.addEntity({
        getTitle: function () { return $scope.context.title + ($scope.context.dirty ? '*' : ''); },
        link: { state: 'spaces.detail.settings.webhooks.new' },
        getType: _.constant('Webhook'),
        getId: _.constant('WEBHOOKNEW')
      });
    }]
  };

  var callState = {
    name: 'call',
    url: '/call/:callId',
    params: { addToContext: true },
    resolve: {
      call: ['WebhookRepository', 'space', 'webhook', '$stateParams', function (WebhookRepository, space, webhook, $stateParams) {
        return WebhookRepository.getInstance(space).logs.getCall(webhook.sys.id, $stateParams.callId);
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

      // add list as grand parent and webhook as parent
      contextHistory.addEntity(listEntity);
      contextHistory.addEntity(createWebhookCrumb({title: webhook.name}, $stateParams.webhookId));
      contextHistory.addEntity(createWebhookCallCrumb(call));
    }]
  };

  var detail = {
    name: 'detail',
    url: '/:webhookId',
    data: {
      isNew: false
    },
    params: { addToContext: true },
    resolve: {
      webhook: ['WebhookRepository', 'space', '$stateParams', function (WebhookRepository, space, $stateParams) {
        return WebhookRepository.getInstance(space).get($stateParams.webhookId);
      }]
    },
    template: '<cf-webhook-editor cf-ui-tab class="workbench webhook-editor" />',
    controller: ['$scope', '$state', '$stateParams', 'webhook', function ($scope, $state, $stateParams, webhook) {
      $scope.context = $state.current.data;
      $scope.webhook = webhook;

      contextHistory.addEntity(listEntity);
      contextHistory.addEntity(createWebhookCrumb($scope.context, $stateParams.webhookId));
    }],
    children: [callState]
  };

  return {
    name: 'webhooks',
    url: '/webhooks',
    abstract: true,
    children: [list, newWebhook, detail]
  };

  function createWebhookCrumb (context, webhookId) {
    return {
      getTitle: function () {
        return context.title + (context.dirty ? '*' : '');
      },
      link: {
        state: 'spaces.detail.settings.webhooks.detail',
        params: { webhookId: webhookId }
      },
      getType: _.constant('Webhook'),
      getId: _.constant(webhookId)
    };
  }

  function createWebhookCallCrumb (call) {
    return {
      getTitle: _.constant('Call details (' + call.requestAt + ')'),
      link: {
        state: 'spaces.details.settings.webhooks.detail.call',
        params: { callId: call.sys.id }
      },
      getType: _.constant('WebhookCall'),
      getId: _.constant(call.sys.id)
    };
  }
}]);
