'use strict';

angular.module('contentful')
.directive('cfApiKeyList', function () {
  return {
    template: JST['api_key_list'](),
    restrict: 'E',
    controller: 'ApiKeyListController',
    scope: true
  };
})

.controller('ApiKeyListController', ['$scope', 'require', function ($scope, require) {
  var ReloadNotification = require('ReloadNotification');
  var spaceContext = require('spaceContext');
  var accessChecker = require('access_control/AccessChecker');
  var Command = require('command');
  var TheAccountView = require('TheAccountView');
  var $state = require('$state');
  var notification = require('notification');
  var ResourceUtils = require('utils/ResourceUtils');
  var createResourceService = require('services/ResourceService').default;
  var $q = require('$q');
  var LD = require('utils/LaunchDarkly');

  var organization = spaceContext.organizationContext.organization;
  var resources = createResourceService(spaceContext.getId());

  var disableCreateApiKey = accessChecker.shouldDisable('createApiKey');
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

  $scope.createApiKey = Command.create(
    create,
    {
      disabled: function () {
        return disableCreateApiKey || $scope.reachedLimit;
      }
    }
  );

  LD.onFeatureFlag($scope, 'feature-dv-11-2017-environments', function (environmentsEnabled) {
    $scope.environmentsEnabled = environmentsEnabled;
  });

  $scope.keyLinkPrefix = 'spaces.detail.api.keys.detail';
  $scope.$watchGroup([function () {
    return spaceContext.getEnvironmentId();
  }, 'environmentsEnabled'], function (envId, environmentsEnabled) {
    $scope.envId = envId;
    if (environmentsEnabled && envId !== 'master') {
      $scope.keyLinkPrefix = 'spaces.detail.environment.api.keys.detail';
    } else {
      $scope.keyLinkPrefix = 'spaces.detail.api.keys.detail';
    }
  });

  function create () {
    var spaceName = spaceContext.getData(['name']);
    return spaceContext.apiKeyRepo.create(spaceName)
    .then(function (apiKey) {
      const link = $scope.environmentsEnabled && $scope.envId !== 'master'
        ? 'spaces.detail.environment.api.keys.detail'
        : 'spaces.detail.api.keys.detail';
      return $state.go(link, {apiKeyId: apiKey.sys.id});
    }, function (err) {
      notification.error(err.data.message);
    });
  }

  $q.all({
    apiKeys: spaceContext.apiKeyRepo.getAll(),
    resource: resources.get('apiKey'),
    legacy: ResourceUtils.useLegacy(organization)
  }).then(function (result) {
    $scope.apiKeys = result.apiKeys;
    $scope.empty = _.isEmpty($scope.apiKeys);

    var canCreate = ResourceUtils.canCreate(result.resource);
    var limits = ResourceUtils.getResourceLimits(result.resource);

    $scope.legacy = result.legacy;
    $scope.limit = limits.maximum;
    $scope.usage = result.resource.usage;
    $scope.reachedLimit = !canCreate;

    $scope.context.ready = true;
  }).catch(ReloadNotification.apiErrorHandler);
}]);
