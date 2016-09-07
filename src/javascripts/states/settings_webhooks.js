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
    getTitle: function () { return list.label; },
    link: { state: 'spaces.detail.settings.webhooks.list' },
    getType: _.constant('Webhooks'),
    getId: _.constant('WEBHOOKS')
  };

  var list = base({
    name: 'list',
    url: '',
    label: 'Webhooks',
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
    label: 'New webhook',
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
    label: 'Call details',
    resolve: {
      call: ['WebhookRepository', 'space', 'webhook', '$stateParams', function (WebhookRepository, space, webhook, $stateParams) {
        return WebhookRepository.getInstance(space).logs.getCall(webhook.sys.id, $stateParams.callId);
      }]
    },
    views: {
      '@spaces.detail.settings.webhooks': {
        template: JST['webhook_call'](),
        params: { addToContext: true },
        controller: ['$scope', 'require', 'webhook', 'call', function ($scope, require, webhook, call) {
          var $stateParams = require('$stateParams');
          var callId = $stateParams.callId;
          var webhookId = $stateParams.webhookId;

          $scope.call = call;
          $scope.webhook = webhook;
          $scope.context = { parentTitle: webhook.name };

          // add list as grand parent
          contextHistory.addEntity(listEntity);

          // add parent state ('webhook detail') manually as this state renders in the ui-view
          // of the parent of webhook detail and thus the controller for webhook detail state is never called
          // therefore not adding webhook detail to the contextHistory for a deep link
          contextHistory.addEntity({
            getTitle: function () {
              return $scope.context.parentTitle || ($scope.context.title + ($scope.context.dirty ? '*' : ''));
            },
            link: {
              state: 'spaces.detail.settings.webhooks.detail',
              params: { webhookId: webhookId }
            },
            getType: _.constant('Webhook'),
            getId: _.constant(webhookId)
          });

          // add webhook call to contextHistory
          contextHistory.addEntity({
            getTitle: function () { return 'Call details (' + call.requestAt + ')'; },
            link: {
              state: 'spaces.details.settings.webhooks.detail.call',
              params: { callId: callId }
            },
            getType: _.constant('WebhookCall'),
            getId: _.constant(callId)
          });

          try {
            $scope.body = JSON.parse($scope.call.request.body);
            $scope.call.request = _.omit($scope.call.request, ['body']);
          } catch (e) {
            /* eslint no-empty: off */
          }
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
    label: 'Webhook details',
    params: { addToContext: true },
    resolve: {
      webhook: ['WebhookRepository', 'space', '$stateParams', function (WebhookRepository, space, $stateParams) {
        return WebhookRepository.getInstance(space).get($stateParams.webhookId);
      }]
    },
    template: '<cf-webhook-editor cf-ui-tab class="workbench webhook-editor" />',
    controller: ['$scope', 'require', 'webhook', function ($scope, require, webhook) {
      var $state = require('$state');
      var $stateParams = require('$stateParams');
      var webhookId = $stateParams.webhookId;

      $scope.context = $state.current.data;
      $scope.webhook = webhook;

      // add list view as parent
      contextHistory.addEntity(listEntity);

      // add current state
      contextHistory.addEntity({
        getTitle: function () {
          return $scope.context.parentTitle || ($scope.context.title + ($scope.context.dirty ? '*' : ''));
        },
        link: {
          state: 'spaces.detail.settings.webhooks.detail',
          params: { webhookId: webhookId }
        },
        getType: _.constant('Webhook'),
        getId: _.constant(webhookId)
      });
    }],
    children: [callState]
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
