/**
 * @ngdoc directive
 * @name cfSpaceNavBar
 * @description
 * Displays the top navigation bar for space views.
 */
angular.module('contentful')
.factory('makeNavBar', ['require', require => {
  var template = require('navigation/SpaceNavTemplate').default;
  var spaceContext = require('spaceContext');
  var TokenStore = require('services/TokenStore');
  var accessChecker = require('access_control/AccessChecker');

  return (useSpaceEnv, isMaster) => ({
    template: template(useSpaceEnv, isMaster),
    restrict: 'E',
    scope: {},
    controllerAs: 'nav',

    controller: ['$stateParams', function ($stateParams) {
      var controller = this;
      var orgId = spaceContext.organizationContext.organization.sys.id;

      controller.spaceId = $stateParams.spaceId;
      controller.canNavigateTo = canNavigateTo;

      TokenStore.getOrganization(orgId).then(org => {
        controller.usageEnabled = org.pricingVersion === 'pricing_version_2';
      });

      function canNavigateTo (section) {
        var sectionAvailable = accessChecker.getSectionVisibility()[section];
        var enforcements = spaceContext.getData('enforcements') || [];
        var isHibernated = enforcements.some(e => e.reason === 'hibernated');

        return spaceContext.space && !isHibernated && sectionAvailable;
      }
    }]
  });
}])

.directive('cfSpaceNavBar', ['makeNavBar', makeNavBar => makeNavBar(false)])

.directive('cfSpaceEnvNavBar', ['makeNavBar', makeNavBar => makeNavBar(true)])

.directive('cfSpaceMasterNavBar', ['makeNavBar', makeNavBar => makeNavBar(true, true)])

.directive('cfSpaceNavBarWrapped', ['require', require => {
  var LD = require('utils/LaunchDarkly');
  var spaceContext = require('spaceContext');

  return {
    scope: {},
    restrict: 'E',
    controller: ['$scope', $scope => {
      $scope.$watch(() => !!spaceContext.getData(['spaceMembership', 'admin']), isAdmin => {
        $scope.isAdmin = isAdmin;
      });

      LD.onFeatureFlag($scope, 'feature-dv-11-2017-environments', environmentsEnabled => {
        $scope.environmentsEnabled = environmentsEnabled;
      });

      $scope.$watch(() => spaceContext.getEnvironmentId(), envId => {
        $scope.isMaster = envId === 'master';
      });
    }],
    template: [
      '<cf-space-master-nav-bar ng-if=" isAdmin &&  environmentsEnabled &&  isMaster" />',
      '<cf-space-env-nav-bar    ng-if=" isAdmin &&  environmentsEnabled && !isMaster" />',
      '<cf-space-nav-bar        ng-if="!isAdmin || !environmentsEnabled             " />'
    ].join('')
  };
}]);
