'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account/profile', ['require', function (require) {
  var base = require('states/base');
  var h = require('utils/hyperscript').h;

  // Begin feature flag code - feature-bv-06-2017-use-new-navigation
  var K = require('utils/kefir');
  var LD = require('utils/LaunchDarkly');
  // End feature flag code - feature-bv-06-2017-use-new-navigation

  var user = userBase({
    name: 'user',
    url: '/user/{pathSuffix:PathSuffix}'
  });

  var spaceMemberships = userBase({
    name: 'space_memberships',
    url: '/space_memberships/{pathSuffix:PathSuffix}'
  });

  var organizationMemberships = userBase({
    name: 'organization_memberships',
    url: '/organization_memberships/{pathSuffix:PathSuffix}'
  });

  var accessGrants = userBase({
    name: 'access_grants',
    url: '/access_grants/{pathSuffix:PathSuffix}'
  });

  var applications = userBase({
    name: 'applications',
    url: '/developers/applications/{pathSuffix:PathSuffix}'
  });

  var userCancellation = userBase({
    name: 'user_cancellation',
    url: '/user_cancellation/{pathSuffix:PathSuffix}'
  });

  function userBase (definition) {
    var defaults = {
      label: 'Account',
      params: {
        pathSuffix: ''
      },
      controller: ['$scope', function ($scope) {
        $scope.context = {};

        // Begin feature flag code - feature-bv-06-2017-use-new-navigation
        setShowNewNav($scope);
        // End feature flag code - feature-bv-06-2017-use-new-navigation
      }],
      template: [
        h('cf-profile-old-nav', { ngIf: '!showNewNav' }),
        h('cf-account-view', { withTabs: '!showNewNav', context: 'context' })
      ].join('')
    };

    return base(_.extend(definition, defaults));
  }

  return base({
    name: 'profile',
    url: '/profile',
    abstract: true,
    views: {
      'nav-bar@': {
        template: h('cf-profile-nav', { ngIf: 'showNewNav' }),

        // Begin feature flag code - feature-bv-06-2017-use-new-navigation
        controller: ['$scope', function ($scope) { setShowNewNav($scope); }]
        // End feature flag code - feature-bv-06-2017-use-new-navigation
      }
    },
    children: [
      user,
      spaceMemberships,
      organizationMemberships,
      accessGrants,
      applications,
      userCancellation
    ]
  });

  // Begin feature flag code - feature-bv-06-2017-use-new-navigation
  function setShowNewNav ($scope) {
    var showNewNav$ = LD.getFeatureFlag('feature-bv-06-2017-use-new-navigation');
    K.onValueScope($scope, showNewNav$, function (showNewNav) {
      $scope.showNewNav = showNewNav;
    });
  }
  // End feature flag code - feature-bv-06-2017-use-new-navigation
}]);
