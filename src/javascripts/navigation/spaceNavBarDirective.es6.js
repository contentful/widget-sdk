import { registerFactory, registerDirective } from 'NgRegistry.es6';
import spaceNavTemplateDef from 'navigation/SpaceNavTemplate.es6';

/**
 * @ngdoc directive
 * @name cfSpaceNavBar
 * @description
 * Displays the top navigation bar for space views.
 */
registerFactory('makeNavBar', [
  'spaceContext',
  'services/TokenStore.es6',
  'access_control/AccessChecker/index.es6',
  'app/settings/apps/AppsFeatureFlag.es6',
  (spaceContext, TokenStore, accessChecker, AppsFeatureFlag) => {
    return (useSpaceEnv, isMaster) => ({
      template: spaceNavTemplateDef(useSpaceEnv, isMaster),
      restrict: 'E',
      scope: {},
      controllerAs: 'nav',

      controller: [
        '$scope',
        '$stateParams',
        function($scope, $stateParams) {
          const controller = this;
          const orgId = spaceContext.organization.sys.id;

          controller.spaceId = $stateParams.spaceId;
          controller.canNavigateTo = canNavigateTo;

          TokenStore.getOrganization(orgId).then(org => {
            controller.usageEnabled = org.pricingVersion === 'pricing_version_2';
          });

          AppsFeatureFlag.withAngularScope($scope, value => {
            controller.appsEnabled = value;
          });

          function canNavigateTo(section) {
            if (spaceContext.getEnvironmentId() !== 'master' && isSpaceSettingsSection(section)) {
              return false;
            }

            const sectionAvailable = accessChecker.getSectionVisibility()[section];
            const enforcements = spaceContext.getData('enforcements') || [];
            const isHibernated = enforcements.some(e => e.reason === 'hibernated');

            return spaceContext.space && !isHibernated && sectionAvailable;
          }

          // We don't want to display the following sections within the context of
          // a sandbox space environment.
          function isSpaceSettingsSection(section) {
            const spaceSettingsSections = [
              'settings',
              'users',
              'roles',
              'apiKey',
              'webhooks',
              'previews',
              'usage',
              'apps'
            ];

            return spaceSettingsSections.includes(section);
          }
        }
      ]
    });
  }
]);

registerDirective('cfSpaceNavBar', ['makeNavBar', makeNavBar => makeNavBar(false, true)]);

registerDirective('cfSpaceEnvNavBar', ['makeNavBar', makeNavBar => makeNavBar(true)]);

registerDirective('cfSpaceMasterNavBar', ['makeNavBar', makeNavBar => makeNavBar(true, true)]);

registerDirective('cfSpaceNavBarWrapped', [
  'spaceContext',
  'utils/LaunchDarkly/index.es6',
  'access_control/AccessChecker/index.es6',
  (spaceContext, LD, accessChecker) => ({
    scope: {},
    restrict: 'E',
    controller: [
      '$scope',
      $scope => {
        $scope.$watch(
          () => accessChecker.can('manage', 'Environments'),
          canManageEnvironments => {
            $scope.canManageEnvironments = canManageEnvironments;
          }
        );

        LD.onFeatureFlag($scope, 'feature-dv-11-2017-environments', environmentsEnabled => {
          $scope.environmentsEnabled = environmentsEnabled;
        });

        $scope.$watch(
          () => spaceContext.getEnvironmentId(),
          envId => {
            $scope.isMaster = envId === 'master';
          }
        );
      }
    ],
    template: [
      '<cf-space-master-nav-bar ng-if=" canManageEnvironments &&  environmentsEnabled &&  isMaster" />',
      '<cf-space-env-nav-bar    ng-if=" canManageEnvironments &&  environmentsEnabled && !isMaster" />',
      '<cf-space-nav-bar        ng-if="!canManageEnvironments || !environmentsEnabled             " />'
    ].join('')
  })
]);
