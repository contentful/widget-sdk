import { find } from 'lodash';
import makeState from 'states/Base.es6';
import { getSpaces } from 'services/TokenStore.es6';
import { getStore } from 'TheStore';
import template from 'app/home/HomeTemplate.es6';
import { go } from 'states/Navigator.es6';

const store = getStore();

/**
 * @ngdoc service
 * @name states/home
 * @description
 * If any space exists, the user is redirected to the last accessed space (as
 * defined in local storage) or the first space returned in the spaces listing.
 * The `home` view is loaded only if there are no spaces.
 */
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
      } else {
        // Show the blank homepage otherwise
        $scope.context.ready = true;
      }
    }
  ]
});
