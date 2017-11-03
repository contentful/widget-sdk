'use strict';

angular.module('contentful')

.directive('cfRolesForWalkMe', ['require', function (require) {
  var SpaceContext = require('spaceContext');
  var LD = require('utils/LaunchDarkly');
  var LazyLoader = require('LazyLoader');
  var $rootScope = require('$rootScope');
  var $window = require('$window');

  var isAdminAttr = 'data-space-role-is-admin';
  var roleNamesAttr = 'data-space-role-names';
  var featureName = 'feature-fe-10-2017-walkme-integration-eli-lilly';
  var lastVariation = null;

  return {
    restrict: 'A',
    scope: {},
    link: function (_scope, $el) {
      $rootScope.$on('$stateChangeSuccess', function () {
        LD.getCurrentVariation(featureName).then(function (variation) {
          // if the last variation was for a targeted space
          // when you move out of it, reload to unload WalkMe scripts
          if (lastVariation && lastVariation !== variation) {
            $window.location.reload();
          }

          if (variation && lastVariation !== variation) {
            var spaceMembership = SpaceContext.getData('spaceMembership');
            var isSpaceAdmin = spaceMembership.admin;
            var spaceRoleNames = _.sortBy(_.map(spaceMembership.roles, 'name')).join(',');

            // load attributes needed by walkME
            $el.attr(isAdminAttr, isSpaceAdmin);
            $el.attr(roleNamesAttr, JSON.stringify(spaceRoleNames));

            // load walkMe
            $window._walkmeConfig = {smartLoad: true};
            // variation will be the key into lazy_loader
            // this is to make it easy to handle requests for
            // different files to be loaded for different spaces
            // without having the space id's hard coded here
            // and relying on LD to do it for us. The code changes
            // will be minimal due to this as well
            LazyLoader.get(variation);
          }

          if (!variation) {
            $el.removeAttr(isAdminAttr);
            $el.removeAttr(roleNamesAttr);
          }

          lastVariation = variation;
        });
      });
    }
  };
}]);
