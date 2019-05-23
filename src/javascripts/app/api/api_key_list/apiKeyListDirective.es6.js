import { registerDirective, registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import * as ResourceUtils from 'utils/ResourceUtils.es6';
import { Notification } from '@contentful/forma-36-react-components';
import { getSubscriptionState } from 'account/AccountUtils.es6';

export default function register() {
  registerDirective('cfApiKeyList', () => ({
    template: JST['api_key_list'](),
    restrict: 'E',
    controller: 'ApiKeyListController',
    scope: true
  }));

  registerController('ApiKeyListController', [
    '$scope',
    '$state',
    '$q',
    'spaceContext',
    'command',
    'access_control/AccessChecker/index.es6',
    'services/ResourceService.es6',
    (
      $scope,
      $state,
      $q,
      spaceContext,
      Command,
      accessChecker,
      { default: createResourceService }
    ) => {
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

      $scope.subscriptionState = getSubscriptionState();

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
        resource: resources.get('apiKey')
      })
        .then(result => {
          $scope.apiKeys = result.apiKeys;
          $scope.empty = _.isEmpty($scope.apiKeys);

          const canCreate = ResourceUtils.canCreate(result.resource);
          const limits = ResourceUtils.getResourceLimits(result.resource);

          $scope.legacy = ResourceUtils.isLegacyOrganization(spaceContext.organization);
          $scope.limit = limits.maximum;
          $scope.usage = result.resource.usage;
          $scope.reachedLimit = !canCreate;

          $scope.context.ready = true;
        })
        .catch(ReloadNotification.apiErrorHandler);
    }
  ]);
}
