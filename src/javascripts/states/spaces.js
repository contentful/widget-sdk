'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/spaces
 */

.factory('states/spaces', ['require', function (require) {
  var newSpace = {
    name: 'new',
    url: '_new',
    template: JST.cf_create_space_advice(),
    controller: ['$scope', 'accessChecker', function ($scope, accessChecker) {
      $scope.canCreateSpace = accessChecker.canCreateSpace;
    }]
  };

  return {
    name: 'spaces',
    url: '/spaces',
    abstract: true,
    views: {'nav-bar': { template: '<cf-main-nav-bar />' }},
    children: [newSpace, require('states/spaces/detail')]
  };
}])

.factory('states/spaces/detail', ['require', function (require) {
  var analytics = require('analytics/Analytics');
  var sectionAccess = require('sectionAccess');

  return {
    name: 'detail',
    url: '/:spaceId',
    resolve: {
      spaceContext: ['require', '$stateParams', function (require, $stateParams) {
        var tokenStore = require('tokenStore');
        var spaceContext = require('spaceContext');
        return tokenStore.getSpace($stateParams.spaceId)
        .then(function (space) {
          return spaceContext.resetWithSpace(space);
        });
      }],
      space: ['spaceContext', function (spaceContext) {
        return spaceContext.space;
      }],
      widgets: ['spaceContext', function (spaceContext) {
        return spaceContext.widgets;
      }]
    },
    onEnter: ['space', function (space) {
      analytics.trackSpaceChange(space);
    }],
    controller: ['$scope', 'space', function ($scope, space) {
      $scope.label = space.data.name;

      if (sectionAccess.hasAccessToAny()) {
        sectionAccess.redirectToFirstAccessible();
      }
    }],
    templateProvider: ['space', function (space) {
      if (space.isHibernated()) {
        return JST.cf_space_hibernation_advice();
      } else if (!sectionAccess.hasAccessToAny()) {
        return JST.cf_no_section_available();
      }
    }],
    children: [
      require('states/contentTypes'),
      require('states/entries'),
      require('states/assets'),
      require('app/api/State').default,
      require('states/settings'),
      require('states/learn')
    ]
  };
}]);
