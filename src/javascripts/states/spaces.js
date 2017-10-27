'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/spaces
 */

.factory('states/spaces', ['require', function (require) {
  var h = require('utils/hyperscript').h;

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
    views: {
      'nav-bar': {
        template: h('cf-space-nav-bar', {class: 'app-top-bar__child'})
      }
    },
    children: [newSpace, require('states/spaces/detail')]
  };
}])

.factory('states/spaces/detail', ['require', function (require) {
  var Analytics = require('analytics/Analytics');
  var sectionAccess = require('sectionAccess');
  var TheStore = require('TheStore');

  return {
    name: 'detail',
    url: '/:spaceId',
    resolve: {
      spaceContext: ['require', '$stateParams', function (require, $stateParams) {
        var TokenStore = require('services/TokenStore');
        var spaceContext = require('spaceContext');
        return TokenStore.getSpace($stateParams.spaceId)
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
      Analytics.trackSpaceChange(space);
    }],
    controller: ['$scope', 'space', function ($scope, space) {
      $scope.label = space.data.name;

      if (sectionAccess.hasAccessToAny()) {
        sectionAccess.redirectToFirstAccessible();
        TheStore.set('lastUsedSpace', space.getId());
        TheStore.set('lastUsedOrg', space.getOrganizationId());
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
      require('states/space_home')
    ]
  };
}]);
