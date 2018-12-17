'use strict';

angular
  .module('contentful')
  .directive('cfApiKeyList', () => ({
    template: JST['api_key_list'](),
    restrict: 'E',
    controller: 'ApiKeyListController',
    scope: true
  }))

  .controller('ApiKeyListController', [
    '$scope',
    'require',
    ($scope, require) => {
      const _ = require('lodash');
      const ReloadNotification = require('app/common/ReloadNotification.es6').default;
      const spaceContext = require('spaceContext');
      const accessChecker = require('access_control/AccessChecker');
      const Command = require('command');
      const TheAccountView = require('TheAccountView');
      const $state = require('$state');
      const { Notification } = require('@contentful/forma-36-react-components');
      const ResourceUtils = require('utils/ResourceUtils.es6');
      const createResourceService = require('services/ResourceService.es6').default;
      const $q = require('$q');

      const resources = createResourceService(spaceContext.getId());

      const disableCreateApiKey = accessChecker.shouldDisable('create', 'apiKey');
      $scope.showCreateApiKey = !accessChecker.shouldHide('create', 'apiKey');

      $scope.context.ready = false;

      $scope.placeholderApiKeys = [
        {
          name: 'Website key',
          description: 'Use this key in your website'
        },
        {
          name: 'iOS key',
          description: 'Use this key in your iOS app'
        },
        {
          name: 'Android key',
          description: 'Use this key in your Android app'
        }
      ];

      $scope.subscriptionState = TheAccountView.getSubscriptionState();

      $scope.createApiKey = Command.create(create, {
        disabled: function() {
          return disableCreateApiKey || $scope.reachedLimit;
        }
      });

      function create() {
        const spaceName = spaceContext.getData(['name']);
        return spaceContext.apiKeyRepo.create(spaceName).then(
          apiKey => $state.go('^.detail', { apiKeyId: apiKey.sys.id }),
          err => {
            Notification.error(err.data.message);
          }
        );
      }

      $q.all({
        apiKeys: spaceContext.apiKeyRepo.getAll(),
        resource: resources.get('apiKey'),
        legacy: ResourceUtils.useLegacy(spaceContext.organization)
      })
        .then(result => {
          $scope.apiKeys = result.apiKeys;
          $scope.empty = _.isEmpty($scope.apiKeys);

          const canCreate = ResourceUtils.canCreate(result.resource);
          const limits = ResourceUtils.getResourceLimits(result.resource);

          $scope.legacy = result.legacy;
          $scope.limit = limits.maximum;
          $scope.usage = result.resource.usage;
          $scope.reachedLimit = !canCreate;

          $scope.context.ready = true;
        })
        .catch(ReloadNotification.apiErrorHandler);
    }
  ]);
