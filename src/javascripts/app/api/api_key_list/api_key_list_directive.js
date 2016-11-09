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

.controller('ApiKeyListController', ['$scope', '$injector', function ($scope, $injector) {
  var ReloadNotification = $injector.get('ReloadNotification');
  var spaceContext = $injector.get('spaceContext');
  var accessChecker = $injector.get('accessChecker');
  var Command = $injector.get('command');
  var TheAccountView = $injector.get('TheAccountView');

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
    $scope.entityCreationController.newApiKey,
    {
      disabled: function () {
        return disableCreateApiKey || $scope.reachedLimit;
      }
    }
  );

  spaceContext.apiKeys.getDeliveryKeys()
  .then(function (apiKeys) {
    $scope.context.ready = true;
    return apiKeys;
  })
  .then(function (apiKeys) {
    $scope.apiKeys = apiKeys;
    $scope.empty = _.isEmpty(apiKeys);
    $scope.reachedLimit = $scope.apiKeys.length >= $scope.limit;
  }, accessChecker.wasForbidden($scope.context))
  .catch(ReloadNotification.apiErrorHandler);

}]);
