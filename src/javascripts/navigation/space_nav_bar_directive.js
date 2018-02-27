/**
 * @ngdoc directive
 * @name cfSpaceNavBar
 * @description
 * Displays the top navigation bar for space views.
 */
angular.module('contentful')
.factory('makeNavBar', ['require', function (require) {
  var template = require('navigation/SpaceNavTemplate').default;
  var spaceContext = require('spaceContext');
  var TokenStore = require('services/TokenStore');
  var accessChecker = require('access_control/AccessChecker');

  return function (useSpaceEnv, isMaster) {
    return {
      template: template(useSpaceEnv, isMaster),
      restrict: 'E',
      scope: {},
      controllerAs: 'nav',
      controller: ['$stateParams', function ($stateParams) {
        var controller = this;
        var orgId = spaceContext.organizationContext.organization.sys.id;

        controller.spaceId = $stateParams.spaceId;
        controller.canNavigateTo = canNavigateTo;

        TokenStore.getOrganization(orgId).then(function (org) {
          controller.usageEnabled = org.pricingVersion === 'pricing_version_2';
        });

        function canNavigateTo (section) {
          var sectionAvailable = accessChecker.getSectionVisibility()[section];
          var enforcements = spaceContext.getData('enforcements') || [];
          var isHibernated = enforcements.some(function (e) {
            return e.reason === 'hibernated';
          });

          return spaceContext.space && !isHibernated && sectionAvailable;
        }
      }]
    };
  };
}])

.directive('cfSpaceNavBar', ['makeNavBar', function (makeNavBar) {
  return makeNavBar(false);
}])

.directive('cfSpaceEnvNavBar', ['makeNavBar', function (makeNavBar) {
  return makeNavBar(true);
}])

.directive('cfSpaceMasterNavBar', ['makeNavBar', function (makeNavBar) {
  return makeNavBar(true, true);
}])

.directive('cfSpaceNavBarWrapped', ['require', function (require) {
  var LD = require('utils/LaunchDarkly');
  var spaceContext = require('spaceContext');

  return {
    scope: {},
    restrict: 'E',
    controller: ['$scope', function ($scope) {
      $scope.$watch(function () {
        return !!spaceContext.getData(['spaceMembership', 'admin']);
      }, function (isAdmin) {
        $scope.isAdmin = isAdmin;
      });

      LD.onFeatureFlag($scope, 'feature-dv-11-2017-environments', function (environmentsEnabled) {
        $scope.environmentsEnabled = environmentsEnabled;
      });

      $scope.$watch(function () {
        return spaceContext.getEnvironmentId();
      }, function (envId) {
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
