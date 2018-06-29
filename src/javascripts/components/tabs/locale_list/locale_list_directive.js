'use strict';

angular.module('contentful')
.directive('cfLocaleList', [() => ({
  template: JST.locale_list(),
  restrict: 'A',
  controller: 'LocaleListController'
})])

.controller('LocaleListController', ['$scope', 'require', ($scope, require) => {
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

  var {showDialog: showSpaceModal} = require('services/ChangeSpaceService');

  // Start: incentivize upgrade feature flag
  var LD = require('utils/LaunchDarkly');
  var flagName = 'feature-bv-06-2018-incentivize-upgrade';

  LD.onFeatureFlag($scope, flagName, isEnabled => {
    $scope.showUpgradeIncentive = isEnabled;
  });
  // End: incentivize upgrade feature flag

  ResourceUtils.useLegacy(organization).then(legacy => {
    $scope.showSidebar = !legacy;
    $scope.upgradeSpacePlan = () => {
      showSpaceModal({
        organizationId: organization.sys.id,
        space: spaceContext.space.data,
        limitReached: $scope.resource,
        action: 'change',
        onSubmit: function () {
          resource = null;
          return updateLocalesUsageState()
            .catch(ReloadNotification.apiErrorHandler);
        }
      });
    };
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
  $scope.subscriptionPlanName = getSubscriptionPlanData('name');
  $scope.newLocale = newLocale;
  $scope.showSidebar = false;
  $scope.insideMasterEnv = true;

  if (!EnvironmentUtils.isInsideMasterEnv(spaceContext)) {
    $scope.insideMasterEnv = false;
  }

  TheLocaleStore.refresh()
  .then(locales => {
    $scope.locales = locales;
    $scope.localeNamesByCode = groupLocaleNamesByCode(locales);

    return updateLocalesUsageState();
  })
  .then(() => {
    $scope.context.ready = true;
  })
  .catch(ReloadNotification.apiErrorHandler);

  function groupLocaleNamesByCode (locales) {
    return _.transform(locales, (acc, locale) => {
      acc[locale.code] = locale.name + ' (' + locale.code + ')';
    }, {});
  }

  function updateLocalesUsageState () {
    // The locales usage is only important inside of the master environment.
    // In non-master envs, we skip the call to resources api.
    if (!$scope.insideMasterEnv) {
      return $q.resolve();
    }

    var len = $scope.locales.length;

    return $q.resolve().then(() => {
      if (ResourceUtils.isLegacyOrganization(organization)) {
        return hasMultipleLocales();
      } else {
        // For newer orgs, you can create multiple locales
        // by default. The amount you can create is denoted
        // by the limits
        return true;
      }
    }).then(canCreateMultiple => $q.all({
      canCreateMultiple: canCreateMultiple,
      resource: getPlanResource()
    })).then(result => {
      if (!result.canCreateMultiple) {
        return STATES.NO_MULTIPLE_LOCALES;
      }

      $scope.resource = result.resource;

      var reachedLimit = $scope.resource.usage >= $scope.resource.limits.maximum;

      if (!reachedLimit && len <= 1) {
        return STATES.ONE_LOCALE_USED;
      } else if (!reachedLimit && len > 1) {
        return STATES.MORE_THAN_ONE_LOCALE_USED;
      } else if (reachedLimit) {
        return STATES.LOCALES_LIMIT_REACHED;
      } else {
        return STATES.UNKNOWN;
      }
    }).then(function (state) {
      $scope.localesUsageState = state;
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

  function hasMultipleLocales () {
    return FeatureService.get('multipleLocales');
  }

  function getSubscriptionPlanData (path) {
    return spaceContext.getData(['organization', 'subscriptionPlan'].concat(path));
  }
}]);
