'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account/organizations', ['require', function (require) {
  var base = require('states/base');
  var h = require('utils/hyperscript').h;
  var workbenchHeader = require('app/Workbench').header;

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
    template: [
      workbenchHeader('Create new organization'),
      h('cf-account-view', { context: 'context' })
    ].join('')
  });

  var edit = organizationsBase({
    name: 'edit',
    title: 'Organization information',
    url: '/:orgId/edit{pathSuffix:PathSuffix}'
  });

  var subscription = organizationsBase({
    name: 'subscription',
    title: 'Subscription',
    url: '/:orgId/z_subscription{pathSuffix:PathSuffix}'
  });

  var users = organizationsBase({
    name: 'users',
    title: 'Organization users',
    url: '/:orgId/organization_memberships{pathSuffix:PathSuffix}'
  });

  var spaces = organizationsBase({
    name: 'spaces',
    title: 'Organization spaces',
    url: '/:orgId/spaces{pathSuffix:PathSuffix}'
  });

  var offsitebackup = organizationsBase({
    name: 'offsitebackup',
    title: 'Offsite backup',
    url: '/:orgId/offsite_backup/edit{pathSuffix:PathSuffix}'
  });

  var billing = organizationsBase({
    name: 'billing',
    title: 'Billing',
    url: '/:orgId/z_billing{pathSuffix:PathSuffix}'
  });

  function organizationsBase (definition) {
    var defaults = {
      label: 'Organizations & Billing',
      controller: ['$scope', 'require', function ($scope, require) {
        var TheStore = require('TheStore');
        var $stateParams = require('$stateParams');

        $scope.context = {};
        TheStore.set('lastUsedOrg', $stateParams.orgId);

        // Begin feature flag code - feature-bv-06-2017-use-new-navigation
        LD.setOnScope($scope, 'feature-bv-06-2017-use-new-navigation', 'useNewNavigation');
        // End feature flag code - feature-bv-06-2017-use-new-navigation
      }],
      params: {
        pathSuffix: ''
      },
      template: [
        h('cf-organizations-old-nav', { ngIf: '!useNewNavigation' }),
        workbenchHeader(definition.title),
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
