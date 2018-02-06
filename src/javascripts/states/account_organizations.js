'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account/organizations', ['require', function (require) {
  var base = require('states/Base').default;
  var h = require('ui/Framework').h;
  var workbenchHeader = require('app/Workbench').header;
  var getStore = require('TheStore').getStore;
  var store = getStore();

  var newOrg = base({
    name: 'new',
    url: '/new',
    label: 'Create new organization',
    views: {
      // Override organization navbar from the parent state
      'nav-bar@': { template: '' }
    },
    template: [
      workbenchHeader({ title: [ 'Create new organization' ] }),
      h('cf-account-view', { context: 'context' })
    ]
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

  var subscriptionNew = base({
    name: 'subscription_new',
    url: '/:orgId/subscription',
    label: 'Subscription',
    controller: ['$stateParams', '$scope', function ($stateParams, $scope) {
      $scope.properties = {
        orgId: $stateParams.orgId,
        context: $scope.context
      };
    }],
    template: h('cf-subscription-overview', { properties: 'properties' })
  });

  var usage = base({
    name: 'usage',
    url: '/:orgId/usage',
    label: 'Usage',
    controller: ['$stateParams', '$scope', function ($stateParams, $scope) {
      $scope.properties = {
        orgId: $stateParams.orgId,
        context: $scope.context
      };
    }],
    template: h('cf-platform-usage', { properties: 'properties' })
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
      $scope.properties = {
        orgId: $stateParams.orgId,
        context: $scope.context
      };
    }],
    template: [
      h('cf-new-organization-membership', { properties: 'properties' })
    ],
    // this is duplicated code, but there's no way
    // we can get around it for now
    onEnter: ['$stateParams', function ($stateParams) {
      store.set('lastUsedOrg', $stateParams.orgId);
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
      params: {
        pathSuffix: ''
      },
      template: [
        workbenchHeader({ title: [ definition.title ] }),
        h('cf-account-view', { context: 'context' })
      ],
      onEnter: ['$stateParams', 'require', function ($stateParams, require) {
        var accessChecker = require('access_control/AccessChecker');
        var TokenStore = require('services/TokenStore');
        TokenStore.getOrganization($stateParams.orgId).then(function (org) {
          accessChecker.setOrganization(org);
        });
        store.set('lastUsedOrg', $stateParams.orgId);
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
      subscriptionNew,
      usage,
      users,
      spaces,
      offsitebackup,
      billing
    ]
  });
}]);
