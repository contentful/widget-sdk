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
  var ResourceUtils = require('utils/ResourceUtils');
  var EnvironmentUtils = require('utils/EnvironmentUtils');

  var $q = require('$q');

  var ResourceService = require('services/ResourceService').default;
  var createFeatureService = require('services/FeatureService').default;

  var organization = spaceContext.organizationContext.organization;
  var canUpgrade = require('services/OrganizationRoles').isOwnerOrAdmin(organization);

  var resources = ResourceService(spaceContext.getId());
  var resource;

  var FeatureService = createFeatureService(spaceContext.getId());

  ResourceUtils.useLegacy(organization).then(function (legacy) {
    $scope.showSidebar = !legacy;
  });

  var STATES = {
    NO_MULTIPLE_LOCALES: 1,
    ONE_LOCALE_USED: 2,
    MORE_THAN_ONE_LOCALE_USED: 3,
    LOCALES_LIMIT_REACHED: 4,
    UNKNOWN: 5
  };

  _.extend($scope, STATES);

  $scope.accountUpgradeState = TheAccountView.getSubscriptionState();
  $scope.canUpgrade = canUpgrade;

  $scope.locales = [];
  $scope.localeNamesByCode = {};
  $scope.getPlanLocalesLimit = getPlanLocalesLimit;
  $scope.subscriptionPlanName = getSubscriptionPlanData('name');
  $scope.newLocale = newLocale;
  $scope.showSidebar = false;
  $scope.insideMasterEnv = true;

  if (!EnvironmentUtils.isInsideMasterEnv(spaceContext)) {
    $scope.insideMasterEnv = false;
  }

  TheLocaleStore.refresh()
  .then(function (locales) {
    $scope.locales = locales;
    $scope.localeNamesByCode = groupLocaleNamesByCode(locales);

    // The locales usage is only important inside of the master environment.
    // In non-master envs, we skip the call and set the readystate to true.
    if ($scope.insideMasterEnv) {
      getLocalesUsageState().then(function (state) {
        $scope.localesUsageState = state;

        $scope.context.ready = true;
      });
    } else {
      $scope.context.ready = true;
    }
  })
  .catch(ReloadNotification.apiErrorHandler);

  function groupLocaleNamesByCode (locales) {
    return _.transform(locales, function (acc, locale) {
      acc[locale.code] = locale.name + ' (' + locale.code + ')';
    }, {});
  }

  function getLocalesUsageState () {
    var len = $scope.locales.length;

    return $q.resolve().then(function () {
      if (ResourceUtils.isLegacyOrganization(organization)) {
        return hasMultipleLocales();
      } else {
        // For newer orgs, you can create multiple locales
        // by default. The amount you can create is denoted
        // by the limits
        return true;
      }
    }).then(function (canCreateMultiple) {
      return $q.all({
        canCreateMultiple: canCreateMultiple,
        usage: getPlanLocalesUsage(),
        limits: getPlanLocalesLimit()
      });
    }).then(function (result) {
      if (!result.canCreateMultiple) {
        return STATES.NO_MULTIPLE_LOCALES;
      }

      $scope.usage = result.usage;
      $scope.limit = result.limits.maximum;

      // You shouldn't reach a limit inside of any non-master environment
      // This is to protect us in case of Resource API inconsistencies
      var reachedLimit = $scope.usage >= $scope.limit;

      if (!reachedLimit && len <= 1) {
        return STATES.ONE_LOCALE_USED;
      } else if (!reachedLimit && len > 1) {
        return STATES.MORE_THAN_ONE_LOCALE_USED;
      } else if (reachedLimit) {
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

  function getPlanResource () {
    if (resource) {
      return resource;
    }

    resource = resources.get('locale');


    return resource;
  }

  function getPlanLocalesUsage () {
    return getPlanResource().then(function (resource) {
      return resource.usage;
    });
  }

  function getPlanLocalesLimit () {
    return getPlanResource().then(function (resource) {
      return ResourceUtils.getResourceLimits(resource);
    });
  }

  function hasMultipleLocales () {
    return FeatureService.get('multipleLocales');
  }

  function getSubscriptionPlanData (path) {
    return spaceContext.getData(['organization', 'subscriptionPlan'].concat(path));
  }
}]);
