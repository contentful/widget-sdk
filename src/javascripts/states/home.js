'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/home
 * @description
 * If any space exists, the user is redirected to the last accessed space (as
 * defined in local storage) or the first space returned in the spaces listing.
 * The `home` view is loaded only if there are no spaces.
 */
.factory('states/home', ['require', function (require) {
  var base = require('states/base');
  var $location = require('$location');
  var $state = require('$state');
  var tokenStore = require('services/TokenStore');
  var TheStore = require('TheStore');
  var template = require('app/home/HomeTemplate').default;

  return base({
    name: 'home',
    url: '/*path',
    template: template(),
    loadingText: 'Loading...',
    resolve: {
      spaces: function () {
        return tokenStore.getSpaces().then(function (spaces) {

          if (spaces.length) {
            var lastUsedSpace = getLastUsedSpace(spaces);
            var space = lastUsedSpace || spaces[0];

            $state.go('spaces.detail', {spaceId: space.sys.id});
          }
        });

        function getLastUsedSpace (spaces) {
          var spaceId = TheStore.get('lastUsedSpace');
          return _.find(spaces, function (space) {
            return space.sys.id === spaceId;
          });
        }
      }
    },
    controller: ['$scope', function ($scope) {
      $scope.context = {ready: false};

      // if this state was loaded, but we don't
      // recognize the URL, redirect to /
      if (_.includes(['', '/'], $location.url())) {
        $scope.context.ready = true;
      } else {
        $location.url('/');
      }
    }]
  });
}]);
