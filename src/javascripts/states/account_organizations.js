'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/account
 */
.factory('states/account/organizations', ['require', require => {
  var base = require('states/Base').default;
  var h = require('ui/Framework').h;
  var workbenchHeader = require('app/Workbench').header;
  var getStore = require('TheStore').getStore;
  var store = getStore();

  // A list of states that have been changed
  // to be adapted to the new pricing model (V2).
  // Orgs that are still in the old pricing model
  // still access the V1 state
  var migratedStates = [{
    v1: 'account.organizations.subscription',
    v2: 'account.organizations.subscription_new'
  }];

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

  var edit = gatekeeperBase({
    name: 'edit',
    title: 'Organization information',
    url: '/:orgId/edit{pathSuffix:PathSuffix}'
  });

  var subscription = gatekeeperBase({
    name: 'subscription',
    title: 'Subscription',
    url: '/:orgId/z_subscription{pathSuffix:PathSuffix}'
  });

  var subscriptionNew = reactBase({
    name: 'subscription_new',
    url: '/:orgId/subscription_overview',
    label: 'Subscription',
    componentName: 'cf-subscription-overview'
  });

  var subscriptionBilling = gatekeeperBase({
    name: 'subscription_billing',
    title: 'Subscription',
    url: '/:orgId/subscription{pathSuffix:PathSuffix}',
    hideHeader: true
  });

  var usage = reactBase({
    name: 'usage',
    url: '/:orgId/usage',
    label: 'Usage',
    componentName: 'cf-platform-usage'
  });

  var usersGatekeeper = gatekeeperBase({
    name: 'gatekeeper',
    title: 'Organization users',
    url: '{pathSuffix:PathSuffix}'
  });

  var newUser = base({
    label: 'Organizations & Billing',
    name: 'new',
    title: 'Organization users',
    url: '/new',
    controller: ['$stateParams', '$scope', ($stateParams, $scope) => {
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
    onEnter: ['$stateParams', $stateParams => {
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

  var spaces = gatekeeperBase({
    name: 'spaces',
    title: 'Organization spaces',
    url: '/:orgId/spaces{pathSuffix:PathSuffix}'
  });

  var offsitebackup = gatekeeperBase({
    name: 'offsitebackup',
    title: 'Offsite backup',
    url: '/:orgId/offsite_backup/edit{pathSuffix:PathSuffix}'
  });

  var billing = gatekeeperBase({
    name: 'billing',
    title: 'Billing',
    url: '/:orgId/z_billing{pathSuffix:PathSuffix}'
  });

  function gatekeeperBase (definition) {
    var defaults = {
      params: {
        pathSuffix: ''
      },
      template: [
        !definition.hideHeader && workbenchHeader({ title: [ definition.title ] }),
        h('cf-account-view', { context: 'context', hideHeader: definition.hideHeader ? 'true' : 'false' })
      ]
    };
    return organizationsBase(_.extend(defaults, definition));
  }

  function reactBase (definition) {
    var defaults = {
      controller: ['$stateParams', '$scope', ($stateParams, $scope) => {
        $scope.properties = {
          orgId: $stateParams.orgId,
          context: $scope.context
        };
      }],
      template: h(definition.componentName, { properties: 'properties' })
    };
    return organizationsBase(_.extend(defaults, definition));
  }

  function organizationsBase (definition) {
    var defaults = {
      label: 'Organizations & Billing',
      onEnter: ['$state', '$stateParams', 'require', ($state, $stateParams, require) => {
        var accessChecker = require('access_control/AccessChecker');
        var useLegacy = require('utils/ResourceUtils').useLegacy;
        var TokenStore = require('services/TokenStore');
        var go = require('states/Navigator').go;

        TokenStore.getOrganization($stateParams.orgId).then(org => {
          var migration = migratedStates.find(state => $state.is(state.v1));
          accessChecker.setOrganization(org);
          store.set('lastUsedOrg', $stateParams.orgId);

          useLegacy(org).then(isLegacy => {
            var shouldRedirectToV2 = !isLegacy && Boolean(migration);
            // redirect old v1 state to the new v2 state
            // in case a user from a previously v1 org has
            // the URL bookmarked
            if (shouldRedirectToV2) {
              go({
                path: migration.v2.split('.'),
                params: { orgId: $stateParams.orgId }
              });
            }
          });
        });
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
      subscriptionBilling,
      usage,
      users,
      spaces,
      offsitebackup,
      billing
    ]
  });
}]);
