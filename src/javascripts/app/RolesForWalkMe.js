import { getModule } from 'core/NgRegistry';
import { WALK_FOR_ME as WALK_FOR_ME_FLAG } from 'featureFlags';
import _ from 'lodash';
import * as LazyLoader from 'utils/LazyLoader';
import { getVariation } from 'LaunchDarkly';

const IS_ADMIN_ATTR = 'data-space-role-is-admin';
const ROLE_NAMES_ATTR = 'data-space-role-names';
let lastVariation = null;

const setAttrOnAppContainer = (attr, value) => {
  const container = document.querySelector('cf-app-container');

  container && container.setAttribute(attr, value);
};

const removeAttrOnAppContainer = (attr) => {
  const container = document.querySelector('cf-app-container');

  container && container.removeAttribute(attr);
};

export const init = () => {
  const $rootScope = getModule('$rootScope');
  const spaceContext = getModule('spaceContext');

  $rootScope.$on('$stateChangeSuccess', () => {
    const spaceId = spaceContext.space.data.sys.id;

    getVariation(WALK_FOR_ME_FLAG, { spaceId }).then((variation) => {
      // Don't do anything if last and current variation are both null
      if (lastVariation === null && variation === null) {
        return;
      }

      // If the new space is not the same variation, then reload the app
      // to remove the scripts from the page
      if (lastVariation && variation !== lastVariation) {
        window.location.reload();
      }

      if (variation && variation !== lastVariation) {
        const spaceMember = spaceContext.getData('spaceMember');
        const isSpaceAdmin = spaceMember ? spaceMember.admin : false;
        const spaceRoleNames = _.sortBy(_.map(spaceMember ? spaceMember.roles : [], 'name')).join(
          ','
        );

        // Update attributes to current values
        //
        // These attributes must be set on `cf-app-container` directly, as the current code for
        // walkMe has jQuery selectors like `cf-app-container[data-space-role-names="SuperAdmin"]`.
        setAttrOnAppContainer(IS_ADMIN_ATTR, isSpaceAdmin);
        setAttrOnAppContainer(ROLE_NAMES_ATTR, JSON.stringify(spaceRoleNames));

        // Tell walkMe to use smartLoad
        window._walkmeConfig = { smartLoad: true };

        // The variation is currently either `walkMeStaging` or `walkMeProd`, which
        // map to the values in LazyLoader. Since the code doesn't change between
        // spaces of the same variation, this is okay.
        LazyLoader.get(variation);
      }

      if (!variation) {
        removeAttrOnAppContainer(IS_ADMIN_ATTR);
        removeAttrOnAppContainer(ROLE_NAMES_ATTR);
      }

      lastVariation = variation;
    });
  });
};
