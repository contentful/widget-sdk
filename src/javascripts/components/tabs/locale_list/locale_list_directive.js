'use strict';

angular.module('contentful')
.directive('cfLocaleList', [() => ({
  template: JST.locale_list(),
  restrict: 'A',
  controller: 'LocaleListController'
})])

.controller('LocaleListController', ['$scope', 'require', ($scope, require) => {
  const ReloadNotification = require('ReloadNotification');
  const spaceContext = require('spaceContext');
  const TheAccountView = require('TheAccountView');
  const TheLocaleStore = require('TheLocaleStore');
  const notification = require('notification');
  const enforcements = require('access_control/Enforcements');
  const $state = require('$state');
  const ResourceUtils = require('utils/ResourceUtils');
  const EnvironmentUtils = require('utils/EnvironmentUtils');

  const $q = require('$q');

  const ResourceService = require('services/ResourceService').default;
  const createFeatureService = require('services/FeatureService').default;

  const organization = spaceContext.organizationContext.organization;
  const canUpgrade = require('services/OrganizationRoles').isOwnerOrAdmin(organization);

  const resources = ResourceService(spaceContext.getId());
  let resource;

  const FeatureService = createFeatureService(spaceContext.getId());

  const {showDialog: showSpaceModal} = require('services/ChangeSpaceService');

  // Start: incentivize upgrade feature flag
  const LD = require('utils/LaunchDarkly');
  const flagName = 'feature-bv-06-2018-incentivize-upgrade';

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
        action: 'change',
        scope: 'space',
        onSubmit: function () {
          resource = null;
          return updateLocalesUsageState()
            .catch(ReloadNotification.apiErrorHandler);
        }
      });
    };
  });

  const STATES = {
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

    const len = $scope.locales.length;

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

      const reachedLimit = $scope.resource.usage >= $scope.resource.limits.maximum;

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
    const organization = spaceContext.organization;
    const usage = enforcements.computeUsageForOrganization(organization, 'locale');

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
