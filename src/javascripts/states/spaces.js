'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/spaces
 */

.factory('states/spaces', ['$injector', function ($injector) {
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
    resolve: {
      spaces: ['tokenStore', function (tokenStore) {
        return tokenStore.getSpaces();
      }]
    },
    views: {
      'content': { template: '<ui-view>' },
      'main-nav-bar': { template: '<cf-main-nav-bar>' }
    },
    children: [newSpace, $injector.get('states/spaces/detail')]
  };
}])

.factory('states/spaces/detail', ['$injector', function ($injector) {
  return {
    name: 'detail',
    url: '/:spaceId',
    resolve: {
      spaceContext: ['require', '$stateParams', function (require, $stateParams) {
        var tokenStore = require('tokenStore');
        var spaceContext = require('spaceContext');
        var analytics = require('analytics');
        return tokenStore.getSpace($stateParams.spaceId)
        .then(function (space) {
          analytics.setSpace(space);
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
    ncyBreadcrumb: {
      skip: true
    },
    controller: ['$scope', 'space', 'sectionAccess', function ($scope, space, sectionAccess) {
      $scope.label = space.data.name;

      if (sectionAccess.hasAccessToAny()) {
        sectionAccess.redirectToFirstAccessible();
      }
    }],
    templateProvider: ['space', 'sectionAccess', function (space, sectionAccess) {
      if (space.isHibernated()) {
        return JST.cf_space_hibernation_advice();
      } else if (sectionAccess.hasAccessToAny()) {
        return '<cf-breadcrumbs></cf-breadcrumbs><ui-view></ui-view>';
      } else {
        return JST.cf_no_section_available();
      }
    }],
    children: [
      $injector.get('states/contentTypes'),
      $injector.get('states/entries'),
      $injector.get('states/assets'),
      $injector.get('states/api'),
      $injector.get('states/settings'),
      $injector.get('states/learn')
    ]
  };
}]);
