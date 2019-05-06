import { registerFactory, registerDirective } from 'NgRegistry.es6';
import spaceNavTemplateDef from 'navigation/SpaceNavTemplate.es6';

// We don't want to display the following sections within the context of
// a sandbox space environment.
const SPACE_SETTINGS_SECTIONS = [
  'settings',
  'users',
  'roles',
  'apiKey',
  'webhooks',
  'previews',
  'apps'
];

export default function register() {
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
    (spaceContext, TokenStore, accessChecker) => {
      return (useSpaceEnv, isMaster) => ({
        template: spaceNavTemplateDef(useSpaceEnv, isMaster),
        restrict: 'E',
        scope: {},
        controllerAs: 'nav',

        controller: [
          '$stateParams',
          function($stateParams) {
            const controller = this;
            const orgId = spaceContext.organization.sys.id;

            controller.spaceId = $stateParams.spaceId;
            controller.canNavigateTo = canNavigateTo;

            TokenStore.getOrganization(orgId).then(org => {
              controller.usageEnabled = org.pricingVersion === 'pricing_version_2';
            });

            function canNavigateTo(section) {
              const isSpaceSettingsSection = SPACE_SETTINGS_SECTIONS.includes(section);
              if (isSpaceSettingsSection && !isMaster) {
                return false;
              }

              const sectionAvailable = accessChecker.getSectionVisibility()[section];
              const enforcements = spaceContext.getData('enforcements') || [];
              const isHibernated = enforcements.some(e => e.reason === 'hibernated');

              return spaceContext.space && !isHibernated && sectionAvailable;
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
}
