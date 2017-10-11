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

  var usersGatekeeper = organizationsBase({
    name: 'gatekeeper',
    title: 'Organization users',
    url: '{pathSuffix:PathSuffix}'
  });

  var newUser = base({
    label: 'Organizations & Billing',
    name: 'new',
    title: 'Organization users',
    url: '/new',
    controller: ['$stateParams', '$scope', function ($stateParams, $scope) {
      // Begin feature flag code - feature-bv-09-2017-invite-to-org
      var LD = require('utils/LaunchDarkly');
      LD.setOnScope($scope, 'feature-bv-09-2017-invite-to-org', 'useNewOrgInvitation');
      // End feature flag code - feature-bv-09-2017-invite-to-org

      $scope.context = {};

      $scope.properties = {
        orgId: $stateParams.orgId,
        context: $scope.context
      };
    }],
    template: [
      workbenchHeader('Organization users'),
      h('cf-new-organization-membership', { ngIf: 'useNewOrgInvitation', properties: 'properties' }),
      h('cf-account-view', { ngIf: '!useNewOrgInvitation', context: 'context' })
    ].join(''),
    // this is duplicated code, but there's no way
    // we can get around it for now
    onEnter: ['$stateParams', function ($stateParams) {
      var TheStore = require('TheStore');
      TheStore.set('lastUsedOrg', $stateParams.orgId);
    }]
  });

  var users = organizationsBase({
    name: 'users',
    title: 'Organization users',
    url: '/:orgId/organization_memberships',
    abstract: true,
    children: [
      newUser,
      usersGatekeeper
    ]
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
      controller: ['$scope', function ($scope) {
        $scope.context = {};
      }],
      params: {
        pathSuffix: ''
      },
      template: [
        workbenchHeader(definition.title),
        h('cf-account-view', { context: 'context' })
      ].join(''),
      onEnter: ['$stateParams', function ($stateParams) {
        var TheStore = require('TheStore');
        TheStore.set('lastUsedOrg', $stateParams.orgId);
      }]
    };
    return base(_.extend(defaults, definition));
  }

  return base({
    name: 'organizations',
    url: '/organizations',
    abstract: true,
    views: {
      'nav-bar@': {
        template: h('cf-organization-nav', { class: 'app-top-bar__child' })
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
