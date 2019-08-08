import { registerFactory, registerDirective } from 'NgRegistry.es6';
import spaceNavTemplateDef from 'navigation/SpaceNavTemplate.es6';
import { ENVIRONMENTS_FLAG, TEAMS_IN_SPACES, APPS_BETA } from 'featureFlags.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';

import * as LD from 'utils/LaunchDarkly/index.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import * as TokenStore from 'services/TokenStore.es6';

// We don't want to display the following sections within the context of
// a sandbox space environment.
const SPACE_SETTINGS_SECTIONS = [
  'settings',
  'users',
  'teams',
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
    spaceContext => {
      return (useSpaceEnv, isMaster) => ({
        template: spaceNavTemplateDef(useSpaceEnv, isMaster),
        restrict: 'E',
        scope: {},
        controllerAs: 'nav',

        controller: [
          '$scope',
          'utils/LaunchDarkly/index.es6',
          '$stateParams',
          function($scope, LD, $stateParams) {
            const controller = this;
            const orgId = spaceContext.organization.sys.id;

            controller.spaceId = $stateParams.spaceId;
            controller.canNavigateTo = canNavigateTo;

            TokenStore.getOrganization(orgId).then(org => {
              controller.usageEnabled = org.pricingVersion === 'pricing_version_2';
            });

            LD.onFeatureFlag($scope, TEAMS_IN_SPACES, teamsInSpacesFF => {
              controller.teamsInSpacesFF = teamsInSpacesFF;
            });
            LD.onFeatureFlag($scope, APPS_BETA, appsBetaEnabled => {
              controller.appsBetaEnabled = appsBetaEnabled;
            });
            getOrgFeature(orgId, 'teams').then(value => {
              controller.hasOrgTeamFeature = value;
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
    spaceContext => ({
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

          LD.onFeatureFlag($scope, ENVIRONMENTS_FLAG, environmentsEnabled => {
            $scope.environmentsEnabled = environmentsEnabled;
          });

          $scope.$watch(
            () => spaceContext.isMasterEnvironment(),
            isMasterEnvironment => {
              $scope.isMaster = isMasterEnvironment;
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
