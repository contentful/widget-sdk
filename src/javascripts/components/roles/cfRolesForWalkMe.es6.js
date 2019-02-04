import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import { WALK_FOR_ME } from 'featureFlags.es6';

export default function register() {
  registerDirective('cfRolesForWalkMe', [
    '$rootScope',
    '$window',
    'spaceContext',
    'LazyLoader',
    'utils/LaunchDarkly/index.es6',
    ($rootScope, $window, spaceContext, LazyLoader, LD) => {
      const isAdminAttr = 'data-space-role-is-admin';
      const roleNamesAttr = 'data-space-role-names';
      let lastVariation = null;

      return {
        restrict: 'A',
        scope: {},
        link: function(_scope, $el) {
          $rootScope.$on('$stateChangeSuccess', () => {
            LD.getCurrentVariation(WALK_FOR_ME).then(variation => {
              // if the last variation was for a targeted space
              // when you move out of it, reload to unload WalkMe scripts
              if (lastVariation && variation !== lastVariation) {
                $window.location.reload();
              }

              if (variation && variation !== lastVariation) {
                const spaceMembership = spaceContext.getData('spaceMembership');
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
}
