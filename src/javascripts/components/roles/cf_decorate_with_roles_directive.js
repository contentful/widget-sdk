'use strict';

angular.module('contentful')

.directive('cfDecorateWithRoles', ['require', function (require) {
  var SpaceContext = require('spaceContext');
  var LD = require('utils/LaunchDarkly');
  var LazyLoader = require('LazyLoader');
  var $rootScope = require('$rootScope');
  var $window = require('$window');

  var isAdminAttr = 'data-space-role-is-admin';
  var roleNamesAttr = 'data-space-role-names';
  var featureName = 'feature-fe-10-2017-expose-user-space-role-in-dom-eli-lilly';

  return {
    restrict: 'A',
    scope: {},
    link: function (_scope, $el) {
      $rootScope.$on('$stateChangeSuccess', function (_e, _to) {
        LD.getCurrentVariation(featureName).then(function (variation) {
          $el.removeAttr(isAdminAttr);
          $el.removeAttr(roleNamesAttr);

          if (variation) {
            var spaceMembership = SpaceContext.getData('spaceMembership');
            var isSpaceAdmin = spaceMembership.admin;
            var spaceRoleNames = _.sortBy(_.map(spaceMembership.roles, 'name')).join(',');

            // load attributes needed by walkME
            $el.attr(isAdminAttr, isSpaceAdmin);
            $el.attr(roleNamesAttr, JSON.stringify(spaceRoleNames));

            // load walkMe
            $window._walkmeConfig = {smartLoad: true};
            LazyLoader.get('walkMe');
          }
        });
      });
    }
  };
}]);
