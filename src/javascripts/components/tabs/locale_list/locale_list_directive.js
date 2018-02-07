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
  var notification = require('notification');
  var enforcements = require('access_control/Enforcements');
  var $state = require('$state');
  var accessChecker = require('access_control/AccessChecker');

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
  $scope.getPlanLocalesLimit = getPlanLocalesLimit;
  $scope.getSubscriptionPlanName = _.partial(getSubscriptionPlanData, 'name');
  $scope.newLocale = newLocale;

  TheLocaleStore.refresh()
  .then(function (locales) {
    $scope.locales = locales;
    $scope.localeNamesByCode = groupLocaleNamesByCode(locales);
    $scope.context.ready = true;
    getLocalesUsageState().then(function (value) {
      $scope.localesUsageState = value;
    });
  })
  .catch(ReloadNotification.apiErrorHandler);

  function groupLocaleNamesByCode (locales) {
    return _.transform(locales, function (acc, locale) {
      acc[locale.code] = locale.name + ' (' + locale.code + ')';
    }, {});
  }

  function getLocalesUsageState () {
    var len = $scope.locales.length;

    return hasMultipleLocales().then(function (value) {
      if (!value) {
        return STATES.NO_MULTIPLE_LOCALES;
      }
      var belowLimit = getPlanLocalesUsage() < getPlanLocalesLimit();
      if (belowLimit && len <= 1) {
        return STATES.ONE_LOCALE_USED;
      } else if (belowLimit && len > 1) {
        return STATES.MORE_THAN_ONE_LOCALE_USED;
      } else if (!belowLimit) {
        return STATES.LOCALES_LIMIT_REACHED;
      } else {
        return STATES.UNKNOWN;
      }
    });
  }

  function newLocale () {
    var organization = spaceContext.organization;
    var usage = enforcements.computeUsageForOrganization(organization, 'locale');

    if (usage) {
      return notification.error(usage);
    } else {
      // X.list -> X.new
      $state.go('^.new');
    }
  }

  function getPlanLocalesUsage () {
    return spaceContext.getData(['organization', 'usage', 'permanent', 'locale']);
  }

  function getPlanLocalesLimit () {
    return getSubscriptionPlanData(['limits', 'permanent', 'locale']);
  }

  function hasMultipleLocales () {
    return accessChecker.hasFeature('multipleLocales');
  }

  function getSubscriptionPlanData (path) {
    return spaceContext.getData(['organization', 'subscriptionPlan'].concat(path));
  }
}]);
