import { find } from 'lodash';
import makeState from 'states/Base';
import { getStore } from 'browserStorage';
import { go } from 'states/Navigator';
import { getSpaces, user$ } from 'services/TokenStore';
import { getValue } from 'core/utils/kefir';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
const store = getStore();

/**
 * If any space exists, the user is redirected to the last accessed space (as
 * defined in local storage) or the first space returned in the spaces listing.
 * The `home` view is loaded only if there are no spaces.
 */

function getCurrentOrg(user) {
  const lastUsedOrg = store.get('lastUsedOrg');
  if (user.organizationMemberships) {
    if (user.organizationMemberships.length === 1) {
      return user.organizationMemberships[0];
    } else {
      return (
        user.organizationMemberships &&
        find(
          user.organizationMemberships,
          (membership) => membership.organization.sys.id === lastUsedOrg
        )
      );
    }
  }
}

export default makeState({
  name: 'home',
  url: '/',
  params: {
    orgId: null,
    orgOwnerOrAdmin: null,
  },
  navComponent: EmptyNavigationBar,
  loadingText: 'Loading…',
  resolve: {
    space: function () {
      function getLastUsedSpace(spaces) {
        const spaceId = store.get('lastUsedSpace');
        return spaceId && find(spaces, (space) => space.sys.id === spaceId);
      }

      function getLastUsedOrgSpace(spaces) {
        const orgId = store.get('lastUsedOrg');
        return orgId && find(spaces, (space) => space.organization.sys.id === orgId);
      }

      return getSpaces().then((spaces) => {
        if (spaces.length) {
          return getLastUsedSpace(spaces) || getLastUsedOrgSpace(spaces) || spaces[0];
        }
      });
    },
  },
  // todo: use component directly
  template: `<react-component name="app/home/SpaceHomePage" props="{spaceTemplateCreated: spaceTemplateCreated, orgId: orgId, orgOwnerOrAdmin: orgOwnerOrAdmin}"></react-component>`,
  controller: [
    '$scope',
    '$stateParams',
    'space',
    ($scope, $stateParams, space) => {
      if ($stateParams.orgId) {
        $scope.orgId = $stateParams.orgId;
        $scope.orgOwnerOrAdmin = $stateParams.orgOwnerOrAdmin;
        $scope.context.ready = true;
      } else if (space) {
        // If a space is found during resolving, send the user to that space
        go({
          path: ['spaces', 'detail'],
          params: { spaceId: space.sys.id },
        });
      } else {
        const user = getValue(user$) || {};
        const currentOrgMembership = getCurrentOrg(user);

        if (!currentOrgMembership) {
          // If the user doesn't have any org membership, redirect to the account settings
          go({ path: ['account', 'profile', 'user'] });
          return;
        }

        $scope.orgOwnerOrAdmin =
          currentOrgMembership &&
          (currentOrgMembership.role === 'owner' || currentOrgMembership.role === 'admin');
        $scope.orgId = currentOrgMembership.organization.sys.id;
        $scope.spaceTemplateCreated = false;
        $scope.context.ready = true;
        // This listener is triggered on completion of The Example Space creation
        $scope.$on('spaceTemplateCreated', () => {
          // the 'spaceTemplateCreated' is passed as prop to SpaceHomePage
          // this triggers re-fetch of data and updates space home view
          $scope.spaceTemplateCreated = true;
        });
      }
    },
  ],
});
