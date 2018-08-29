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
      const ReloadNotification = require('ReloadNotification');
      const spaceContext = require('spaceContext');
      const accessChecker = require('access_control/AccessChecker');
      const Command = require('command');
      const TheAccountView = require('TheAccountView');
      const $state = require('$state');
      const notification = require('notification');
      const ResourceUtils = require('utils/ResourceUtils');
      const createResourceService = require('services/ResourceService').default;
      const $q = require('$q');

      const organization = spaceContext.organizationContext.organization;
      const resources = createResourceService(spaceContext.getId());

      const disableCreateApiKey = accessChecker.shouldDisable('createApiKey');
      $scope.showCreateApiKey = !accessChecker.shouldHide('createApiKey');

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
            notification.error(err.data.message);
          }
        );
      }

      $q.all({
        apiKeys: spaceContext.apiKeyRepo.getAll(),
        resource: resources.get('apiKey'),
        legacy: ResourceUtils.useLegacy(organization)
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
