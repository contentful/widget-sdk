/**
 * @ngdoc directive
 * @name cfSpaceNavBar
 * @description
 * Displays the top navigation bar for space views.
 */
angular
  .module('contentful')
  .factory('makeNavBar', [
    'require',
    require => {
      var template = require('navigation/SpaceNavTemplate.es6').default;
      var spaceContext = require('spaceContext');
      var TokenStore = require('services/TokenStore.es6');
      var accessChecker = require('access_control/AccessChecker');
      const LD = require('utils/LaunchDarkly');
      const APPS_FLAG_NAME = 'feature-te-11-2018-apps';

      return (useSpaceEnv, isMaster) => ({
        template: template(useSpaceEnv, isMaster),
        restrict: 'E',
        scope: {},
        controllerAs: 'nav',

        controller: [
          '$scope',
          '$stateParams',
          function($scope, $stateParams) {
            var controller = this;
            var orgId = spaceContext.organization.sys.id;

            controller.spaceId = $stateParams.spaceId;
            controller.canNavigateTo = canNavigateTo;

            TokenStore.getOrganization(orgId).then(org => {
              controller.usageEnabled = org.pricingVersion === 'pricing_version_2';
            });

            LD.onFeatureFlag($scope, APPS_FLAG_NAME, value => {
              controller.appsEnabled = value;
            });

            function canNavigateTo(section) {
              if (spaceContext.getEnvironmentId() !== 'master' && isSpaceSettingsSection(section)) {
                return false;
              }

              var sectionAvailable = accessChecker.getSectionVisibility()[section];
              var enforcements = spaceContext.getData('enforcements') || [];
              var isHibernated = enforcements.some(e => e.reason === 'hibernated');

              return spaceContext.space && !isHibernated && sectionAvailable;
            }

            // We don't want to display the following sections within the context of
            // a sandbox space environment.
            function isSpaceSettingsSection(section) {
              var spaceSettingsSections = [
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
  ])

  .directive('cfSpaceNavBar', ['makeNavBar', makeNavBar => makeNavBar(false, true)])

  .directive('cfSpaceEnvNavBar', ['makeNavBar', makeNavBar => makeNavBar(true)])

  .directive('cfSpaceMasterNavBar', ['makeNavBar', makeNavBar => makeNavBar(true, true)])

  .directive('cfSpaceNavBarWrapped', [
    'require',
    require => {
      var LD = require('utils/LaunchDarkly');
      var spaceContext = require('spaceContext');
      var accessChecker = require('access_control/AccessChecker');

      return {
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
      };
    }
  ]);
