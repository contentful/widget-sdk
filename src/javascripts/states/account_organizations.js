'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account/organizations', ['require', function (require) {
  var base = require('states/base');
  var h = require('utils/hyperscript').h;

  // Begin feature flag code - feature-bv-06-2017-use-new-navigation
  var LD = require('utils/LaunchDarkly');
  // End feature flag code - feature-bv-06-2017-use-new-navigation

  var newOrg = base({
    name: 'new',
    url: '/new',
    label: 'Create new organization',
    views: {
      // Override org navbar from paremt state
      'nav-bar@': { template: '' }
    },
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: h('cf-account-view', { context: 'context' })
  });

  var edit = organizationsBase({
    name: 'edit',
    url: '/:orgId/edit{pathSuffix:PathSuffix}'
  });

  var subscription = organizationsBase({
    name: 'subscription',
    url: '/:orgId/z_subscription{pathSuffix:PathSuffix}'
  });

  var users = organizationsBase({
    name: 'users',
    url: '/:orgId/organization_memberships{pathSuffix:PathSuffix}'
  });

  var spaces = organizationsBase({
    name: 'spaces',
    url: '/:orgId/spaces{pathSuffix:PathSuffix}'
  });

  var offsitebackup = organizationsBase({
    name: 'offsitebackup',
    url: '/:orgId/offsite_backup/edit{pathSuffix:PathSuffix}'
  });

  var billing = organizationsBase({
    name: 'billing',
    url: '/:orgId/z_billing{pathSuffix:PathSuffix}'
  });

  function organizationsBase (definition) {
    var defaults = {
      label: 'Organizations & Billing',
      controller: ['$scope', function ($scope) {
        $scope.context = {};

        // Begin feature flag code - feature-bv-06-2017-use-new-navigation
        LD.setOnScope($scope, 'feature-bv-06-2017-use-new-navigation', 'useNewNavigation');
        // End feature flag code - feature-bv-06-2017-use-new-navigation
      }],
      params: {
        pathSuffix: ''
      },
      template: [
        h('cf-organizations-old-nav', { ngIf: '!useNewNavigation' }),
        h('cf-account-view', { withTabs: '!useNewNavigation', context: 'context' })
      ].join('')
    };
    return base(_.extend(definition, defaults));
  }

  return base({
    name: 'organizations',
    url: '/organizations',
    abstract: true,
    views: {
      'nav-bar@': {
        // Begin feature flag code - feature-bv-06-2017-use-new-navigation
        template: h('cf-organization-nav', { ngIf: 'useNewNavigation', class: 'app-top-bar__child' }),
        controller: ['$scope', function ($scope) {
          LD.setOnScope($scope, 'feature-bv-06-2017-use-new-navigation', 'useNewNavigation');
        }]
        // End feature flag code - feature-bv-06-2017-use-new-navigation
      }
    },
    children: [
      newOrg,
      edit,
      subscription,
      users,
      spaces,
      offsitebackup,
      billing
    ]
  });
}]);
