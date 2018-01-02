import {find} from 'lodash';
import makeState from 'states/Base';
import $state from '$state';
import {getSpaces} from 'services/TokenStore';
import TheStore from 'TheStore';
import template from 'app/home/HomeTemplate';

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
    spaces: function () {
      return getSpaces().then((spaces) => {
        if (spaces.length) {
          const space = getLastUsedSpace(spaces) || getLastUsedOrgSpace(spaces) || spaces[0];
          $state.go('spaces.detail', {spaceId: space.sys.id});
        }
      });

      function getLastUsedSpace (spaces) {
        const spaceId = TheStore.get('lastUsedSpace');
        return spaceId && find(spaces, (space) => space.sys.id === spaceId);
      }

      function getLastUsedOrgSpace (spaces) {
        const orgId = TheStore.get('lastUsedOrg');
        return orgId && find(spaces, (space) => space.organization.sys.id === orgId);
      }
    }
  },
  controller: ['$scope', function ($scope) {
    $scope.context = {ready: true};
  }]
});
