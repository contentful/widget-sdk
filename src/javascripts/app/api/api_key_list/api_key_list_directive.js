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
  var accessChecker = require('accessChecker');
  var Command = require('command');
  var TheAccountView = require('TheAccountView');
  var $state = require('$state');
  var notification = require('notification');

  var disableCreateApiKey = accessChecker.shouldDisable('createApiKey');

  $scope.showCreateApiKey = !accessChecker.shouldHide('createApiKey');

  $scope.limit = spaceContext.getData('organization.subscriptionPlan.limits.permanent.apiKey', {});

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

  function create () {
    var spaceName = spaceContext.getData(['name']);
    return spaceContext.apiKeyRepo.create(spaceName)
    .then(function (apiKey) {
      return $state.go('spaces.detail.api.keys.detail', {apiKeyId: apiKey.sys.id});
    }, function () {
      notification.error('Unable to create API key');
    });
  }

  spaceContext.apiKeyRepo.getAll()
  .then(function (apiKeys) {
    $scope.context.ready = true;
    $scope.apiKeys = apiKeys;
    $scope.empty = _.isEmpty(apiKeys);
    $scope.reachedLimit = $scope.apiKeys.length >= $scope.limit;
  }, accessChecker.wasForbidden($scope.context))
  .catch(ReloadNotification.apiErrorHandler);
}]);
