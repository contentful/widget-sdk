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
  var LD = require('utils/LaunchDarkly');
  var TokenStore = require('services/TokenStore');

  return function (useSpaceEnv, canAccessSection) {
    return {
      template: template(useSpaceEnv),
      restrict: 'E',
      scope: {},
      controllerAs: 'nav',
      controller: ['$stateParams', '$scope', function ($stateParams, $scope) {
        var controller = this;
        var orgId = spaceContext.organizationContext.organization.sys.id;

        controller.spaceId = $stateParams.spaceId;
        controller.canNavigateTo = canNavigateTo;

        LD.onFeatureFlag($scope, 'feature-dv-11-2017-environments', function (environmentsEnabled) {
          controller.environmentsEnabled = environmentsEnabled;
        });

        TokenStore.getOrganization(orgId).then(function (org) {
          controller.usageEnabled = org.pricingVersion === 'pricing_version_2';
        });

        function canNavigateTo (section) {
          var enforcements = spaceContext.getData('enforcements') || [];
          var isHibernated = enforcements.some(function (e) {
            return e.reason === 'hibernated';
          });

          return spaceContext.space && !isHibernated && canAccessSection(section);
        }
      }]
    };
  };
}])

.directive('cfSpaceNavBar', ['require', function (require) {
  var makeNavBar = require('makeNavBar');
  var accessChecker = require('access_control/AccessChecker');

  return makeNavBar(false, function (section) {
    return accessChecker.getSectionVisibility()[section];
  });
}])

.directive('cfSpaceEnvNavBar', ['makeNavBar', function (makeNavBar) {
  return makeNavBar(true, function (section) {
    return section !== 'spaceHome';
  });
}]);
