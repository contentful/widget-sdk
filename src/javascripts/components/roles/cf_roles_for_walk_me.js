'use strict';

angular
  .module('contentful')

  .directive('cfRolesForWalkMe', [
    'require',
    require => {
      const _ = require('lodash');
      const SpaceContext = require('spaceContext');
      const LD = require('utils/LaunchDarkly');
      const LazyLoader = require('LazyLoader');
      const $rootScope = require('$rootScope');
      const $window = require('$window');

      const isAdminAttr = 'data-space-role-is-admin';
      const roleNamesAttr = 'data-space-role-names';
      const featureName = 'feature-fe-10-2017-walkme-integration-eli-lilly';
      let lastVariation = null;

      return {
        restrict: 'A',
        scope: {},
        link: function(_scope, $el) {
          $rootScope.$on('$stateChangeSuccess', () => {
            LD.getCurrentVariation(featureName).then(variation => {
              // if the last variation was for a targeted space
              // when you move out of it, reload to unload WalkMe scripts
              if (lastVariation && variation !== lastVariation) {
                $window.location.reload();
              }

              if (variation && variation !== lastVariation) {
                const spaceMembership = SpaceContext.getData('spaceMembership');
                const isSpaceAdmin = spaceMembership.admin;
                const spaceRoleNames = _.sortBy(_.map(spaceMembership.roles, 'name')).join(',');

                // load attributes needed by walkME
                $el.attr(isAdminAttr, isSpaceAdmin);
                $el.attr(roleNamesAttr, JSON.stringify(spaceRoleNames));

                // load walkMe
                $window._walkmeConfig = { smartLoad: true };
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
    }
  ]);
