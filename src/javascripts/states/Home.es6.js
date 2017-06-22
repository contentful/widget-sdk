import {find} from 'lodash';
import makeState from 'states/base';
import $state from '$state';
import {getSpaces} from 'services/TokenStore';
import TheStore from 'TheStore';
import template from 'app/home/HomeTemplate';
import navBar from 'app/NavBar';


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
  views: { 'nav-bar': { template: navBar() } },
  template: template(),
  loadingText: 'Loading...',
  resolve: {
    spaces: function () {
      return getSpaces().then(function (spaces) {

        if (spaces.length) {
          const lastUsedSpace = getLastUsedSpace(spaces);
          const space = lastUsedSpace || spaces[0];

          $state.go('spaces.detail', {spaceId: space.sys.id});
        }
      });

      function getLastUsedSpace (spaces) {
        const spaceId = TheStore.get('lastUsedSpace');
        return find(spaces, function (space) {
          return space.sys.id === spaceId;
        });
      }
    }
  },
  controller: ['$scope', function ($scope) {
    $scope.context = {ready: true};
  }]
});
