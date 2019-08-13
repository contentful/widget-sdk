import { find } from 'lodash';
import makeState from 'states/Base.es6';
import { getStore } from 'TheStore/index.es6';
import template from 'app/home/HomeTemplate.es6';
import { go } from 'states/Navigator.es6';
import { getSpaces, user$ } from 'services/TokenStore.es6';
import { getValue } from 'utils/kefir.es6';

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
          membership => membership.organization.sys.id === lastUsedOrg
        )
      );
    }
  }
}

export default makeState({
  name: 'home',
  url: '/',
  template: template(),
  loadingText: 'Loading…',
  resolve: {
    space: function() {
      function getLastUsedSpace(spaces) {
        const spaceId = store.get('lastUsedSpace');
        return spaceId && find(spaces, space => space.sys.id === spaceId);
      }

      function getLastUsedOrgSpace(spaces) {
        const orgId = store.get('lastUsedOrg');
        return orgId && find(spaces, space => space.organization.sys.id === orgId);
      }

      return getSpaces().then(spaces => {
        if (spaces.length) {
          return getLastUsedSpace(spaces) || getLastUsedOrgSpace(spaces) || spaces[0];
        }
      });
    }
  },
  controller: [
    '$scope',
    'space',
    ($scope, space) => {
      if (space) {
        // If a space is found during resolving, send the user to that space
        go({
          path: ['spaces', 'detail'],
          params: { spaceId: space.sys.id }
        });
        $scope.hasSpace = true;
      } else {
        const user = getValue(user$) || {};
        const currentOrgMembership = getCurrentOrg(user);

        $scope.orgOwnerOrAdmin =
          currentOrgMembership &&
          (currentOrgMembership.role === 'owner' || currentOrgMembership.role === 'admin');
        $scope.lastUsedOrg = currentOrgMembership.organization.sys.id;
        $scope.hasSpace = false;
        $scope.context.ready = true;
      }
    }
  ]
});
