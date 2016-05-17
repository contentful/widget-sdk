'use strict';

angular.module('contentful')

.controller('LocaleListController', ['$scope', '$injector', function ($scope, $injector) {
  var ReloadNotification = $injector.get('ReloadNotification');

  var organizationId = $scope.spaceContext.space.getOrganizationId();
  $scope.accountUpgradeState = 'account.pathSuffix({ pathSuffix: \'organizations/' +
                               organizationId + '/subscription\' })';
  $scope.locales = [];
  $scope.localesUsageState = getLocalesUsageState();

  $scope.getPlanLocalesUsage = getPlanLocalesUsage;
  $scope.getPlanLocalesLimit = getPlanLocalesLimit;
  $scope.getSubscriptionPlan = getSubscriptionPlan;

  return $scope.spaceContext.space.getLocales()
  .then(function (locales) {
    $scope.locales = locales;
    $scope.localesUsageState = getLocalesUsageState();
    $scope.context.ready = true;
  })
  .catch(ReloadNotification.apiErrorHandler);

  function getLocalesUsageState () {
    if (!hasMultipleLocales()) {
      return 'noMultipleLocales';
    }

    var localesLength = $scope.locales.length;
    if (localesLength <= 1 && getPlanLocalesUsage() < getPlanLocalesLimit()) {
      return 'oneLocaleUsed';
    }
    if (localesLength > 1 && getPlanLocalesUsage() < getPlanLocalesLimit()) {
      return 'moreThanOneLocaleUsed';
    }
    if (getPlanLocalesUsage() >= getPlanLocalesLimit()) {
      return 'localesLimitReached';
    }

    return '';
  }

  function getPlanLocalesUsage () {
    return dotty.get(getOrganization(), 'usage.permanent.locale');
  }

  function getPlanLocalesLimit () {
    return dotty.get(getSubscriptionPlan(), 'limits.permanent.locale');
  }

  function hasMultipleLocales () {
    return !!dotty.get(getSubscriptionPlan(), 'limits.features.multipleLocales');
  }

  function getSubscriptionPlan () {
    return dotty.get(getOrganization(), 'subscriptionPlan');
  }

  function getOrganization () {
    return dotty.get($scope, 'spaceContext.space.data.organization');
  }

}])

.directive('cfLocaleList', function () {
  return {
    template: JST.locale_list(),
    restrict: 'A',
    controller: 'LocaleListController'
  };
});
