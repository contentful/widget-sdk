'use strict';

angular.module('contentful')
.directive('cfLocaleList', [function () {
  return {
    template: JST.locale_list(),
    restrict: 'A',
    controller: 'LocaleListController'
  };
}])

.controller('LocaleListController', ['$scope', 'require', function ($scope, require) {
  var ReloadNotification = require('ReloadNotification');
  var spaceContext = require('spaceContext');
  var TheAccountView = require('TheAccountView');
  var TheLocaleStore = require('TheLocaleStore');

  var STATES = {
    NO_MULTIPLE_LOCALES: 1,
    ONE_LOCALE_USED: 2,
    MORE_THAN_ONE_LOCALE_USED: 3,
    LOCALES_LIMIT_REACHED: 4,
    UNKNOWN: 5
  };

  _.extend($scope, STATES);

  $scope.accountUpgradeState = TheAccountView.getSubscriptionState();

  $scope.locales = [];
  $scope.localeNamesByCode = {};
  $scope.localesUsageState = getLocalesUsageState();
  $scope.getPlanLocalesLimit = getPlanLocalesLimit;
  $scope.getSubscriptionPlanName = _.partial(getSubscriptionPlanData, 'name');

  TheLocaleStore.refresh()
  .then(function () {
    $scope.locales = TheLocaleStore.getLocales();
    $scope.localeNamesByCode = groupLocaleNamesByCode($scope.locales);
    $scope.localesUsageState = getLocalesUsageState();
    $scope.context.ready = true;
  })
  .catch(ReloadNotification.apiErrorHandler);

  function groupLocaleNamesByCode (locales) {
    return _.transform(locales, function (acc, locale) {
      acc[locale.code] = locale.name + ' (' + locale.code + ')';
    }, {});
  }

  function getLocalesUsageState () {
    var len = $scope.locales.length;
    var belowLimit = getPlanLocalesUsage() < getPlanLocalesLimit();

    if (!hasMultipleLocales()) {
      return STATES.NO_MULTIPLE_LOCALES;
    } else if (belowLimit && len <= 1) {
      return STATES.ONE_LOCALE_USED;
    } else if (belowLimit && len > 1) {
      return STATES.MORE_THAN_ONE_LOCALE_USED;
    } else if (!belowLimit) {
      return STATES.LOCALES_LIMIT_REACHED;
    } else {
      return STATES.UNKNOWN;
    }
  }

  function getPlanLocalesUsage () {
    return spaceContext.getData(['organization', 'usage', 'permanent', 'locale']);
  }

  function getPlanLocalesLimit () {
    return getSubscriptionPlanData(['limits', 'permanent', 'locale']);
  }

  function hasMultipleLocales () {
    return !!getSubscriptionPlanData(['limits', 'features', 'multipleLocales']);
  }

  function getSubscriptionPlanData (path) {
    return spaceContext.getData(['organization', 'subscriptionPlan'].concat(path));
  }
}]);
