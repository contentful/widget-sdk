'use strict';

angular.module('contentful')

.controller('LocaleListController', ['$scope', '$injector', function ($scope, $injector) {
  var ReloadNotification = $injector.get('ReloadNotification');

  var organizationId = $scope.spaceContext.space.getOrganizationId();
  $scope.accountUpgradeState = 'account.pathSuffix({ pathSuffix: \'organizations/'+
                               organizationId +'/subscription\' })';
  $scope.locales = [];
  $scope.localesUsageState = getLocalesUsageState();

  $scope.refreshLocales = refreshLocales;
  $scope.getEnabledInfo = getEnabledInfo;
  $scope.getPlanLocalesUsage = getPlanLocalesUsage;
  $scope.getPlanLocalesLimit = getPlanLocalesLimit;
  $scope.getSubscriptionPlan = getSubscriptionPlan;

  $scope.refreshLocales();

  function refreshLocales() {
    // TODO huh?
    // maybe put a method for this on the localestore
    // and figure out how this differs from privatelocales and such
    return $scope.spaceContext.space.getLocales()
    .then(function (locales) {
      $scope.locales = locales;
      $scope.localesUsageState = getLocalesUsageState();
    })
    .catch(ReloadNotification.apiErrorHandler);
  }

  function getEnabledInfo (locale) {
    var info1 = locale.data.contentDeliveryApi   ? 'Publishing' : '';
    var info2 = locale.data.contentManagementApi ? 'Editing'    : '';

    if (info1 && info2) {
      return info1 + ' and ' + info2.toLowerCase();
    } else if (info1 || info2) {
      return info1 + info2 + ' only';
    } else {
      return '-';
    }
  }

  function getLocalesUsageState() {
    if(!hasMultipleLocales())
      return 'noMultipleLocales';
    var localesLength = $scope.locales.length;
    if(localesLength <= 1 && getPlanLocalesUsage() < getPlanLocalesLimit())
      return 'oneLocaleUsed';
    if(localesLength > 1 && getPlanLocalesUsage() < getPlanLocalesLimit())
      return 'moreThanOneLocaleUsed';
    if(getPlanLocalesUsage() >= getPlanLocalesLimit())
      return 'localesLimitReached';
    return '';
  }

  function getPlanLocalesUsage() {
    return dotty.get(getOrganization(), 'usage.permanent.locale');
  }

  function getPlanLocalesLimit() {
    return dotty.get(getSubscriptionPlan(), 'limits.permanent.locale');
  }

  function hasMultipleLocales() {
    return !!dotty.get(getSubscriptionPlan(), 'limits.features.multipleLocales');
  }

  function getSubscriptionPlan() {
    return dotty.get(getOrganization(), 'subscriptionPlan');
  }

  function getOrganization() {
    return dotty.get($scope, 'spaceContext.space.data.organization');
  }

}])

.directive('cfLocaleList', function() {
  return {
    template: JST.locale_list(),
    restrict: 'A',
    controller: 'LocaleListController'
  };
});
