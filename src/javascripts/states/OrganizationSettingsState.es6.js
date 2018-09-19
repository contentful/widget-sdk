// import React from 'react';
import { extend } from 'lodash';
import { h } from 'utils/legacy-html-hyperscript';
import Base from 'states/Base.es6';
import { getStore } from 'TheStore';
import * as Analytics from 'analytics/Analytics.es6';
import { onFeatureFlag } from 'utils/LaunchDarkly';

const store = getStore();

// A list of states that have been changed
// to be adapted to the new pricing model (V2).
// Orgs that are still in the old pricing model
// still access the V1 state
const migratedStates = [
  {
    v1: 'account.organizations.subscription',
    v2: 'account.organizations.subscription_new'
  }
];

const newOrg = Base({
  name: 'new',
  url: '/new',
  label: 'Create new organization',
  views: {
    // Override organization navbar from the parent state
    'nav-bar@': { template: '' }
  },
  template: [
    h('.workbench-header__wrapper', [
      h('header.workbench-header', [h('h1.workbench-header__title', ['Create new organization'])])
    ]),
    h('cf-account-view', { context: 'context' })
  ]
});

const edit = gatekeeperBase({
  name: 'edit',
  title: 'Organization information',
  url: '/:orgId/edit{pathSuffix:PathSuffix}'
});

const subscription = gatekeeperBase({
  name: 'subscription',
  title: 'Subscription',
  url: '/:orgId/z_subscription{pathSuffix:PathSuffix}'
});

const subscriptionNew = reactBase({
  name: 'subscription_new',
  url: '/:orgId/subscription_overview',
  label: 'Subscription',
  componentName: 'cf-subscription-overview'
});

const subscriptionBilling = gatekeeperBase({
  name: 'subscription_billing',
  title: 'Subscription',
  url: '/:orgId/subscription{pathSuffix:PathSuffix}',
  hideHeader: true
});

const usage = reactBase({
  name: 'usage',
  url: '/:orgId/usage',
  label: 'Usage',
  componentName: 'cf-platform-usage'
});

// const usersGatekeeper = gatekeeperBase({
//   name: 'gatekeeper',
//   title: 'Organization users',
//   url: '/:orgId/organization_memberships/{pathSuffix:PathSuffix}'
// });

const userDetail = gatekeeperBase({
  name: 'user',
  params: {
    userId: ''
  },
  title: 'Organization users',
  url: '/:userId/edit',
  featureFlag: 'feature-bv-09-2018-new-org-membership-pages',
  reactComponentName: 'app/OrganizationSettings/Users/UserDetail/UserDetail.es6',
  resolve: {
    membership: [
      'data/EndpointFactory.es6',
      'access_control/OrganizationMembershipRepository.es6',
      '$stateParams',
      async (endpointFactory, repo, $stateParams) => {
        const endpoint = endpointFactory.createOrganizationEndpoint($stateParams.orgId);
        const membership = await repo.getMembership(endpoint, $stateParams.userId);
        const user = await repo.getUser(endpoint, membership.sys.user.sys.id);

        return { ...membership, sys: { ...membership.sys, user } };
      }
    ]
  },
  controller: [
    '$scope',
    'membership',
    ($scope, membership) => {
      setFeatureFlagInScope($scope, 'feature-bv-09-2018-new-org-membership-pages');
      $scope.context.ready = true;
      $scope.properties = {
        membership
      };
    }
  ]
});

const usersList = gatekeeperBase({
  name: 'users',
  children: [userDetail],
  title: 'Organization users',
  url: '/:orgId/organization_memberships',
  featureFlag: 'feature-bv-09-2018-new-org-membership-pages',
  reactComponentName: 'app/OrganizationSettings/Users/UsersList/UsersList.es6'
});

const newUser = Base({
  label: 'Organizations & Billing',
  name: 'users.new',
  title: 'Organization users',
  url: '/new',
  controller: [
    '$stateParams',
    '$scope',
    ($stateParams, $scope) => {
      $scope.properties = {
        orgId: $stateParams.orgId,
        context: $scope.context
      };
    }
  ],
  template: h('cf-new-organization-membership', { properties: 'properties' }),
  // this is duplicated code, but there's no way
  // we can get around it for now
  onEnter: [
    '$stateParams',
    $stateParams => {
      store.set('lastUsedOrg', $stateParams.orgId);
    }
  ]
});

const spaces = gatekeeperBase({
  name: 'spaces',
  title: 'Organization spaces',
  url: '/:orgId/spaces{pathSuffix:PathSuffix}'
});

const offsitebackup = gatekeeperBase({
  name: 'offsitebackup',
  title: 'Offsite backup',
  url: '/:orgId/offsite_backup/edit{pathSuffix:PathSuffix}'
});

const billing = gatekeeperBase({
  name: 'billing',
  title: 'Billing',
  url: '/:orgId/z_billing{pathSuffix:PathSuffix}'
});

function gatekeeperBase(definition) {
  const { featureFlag, title, hideHeader, reactComponentName } = definition;
  const defaults = {
    params: {
      pathSuffix: ''
    },
    controller: [
      '$scope',
      '$stateParams',
      function($scope, $stateParams) {
        featureFlag && setFeatureFlagInScope($scope, featureFlag);

        $scope.properties = {
          orgId: $stateParams.orgId,
          context: $scope.context
        };
      }
    ],
    template: featureFlag
      ? getTemplateFromFeatureFlag(title, hideHeader, reactComponentName)
      : getIframeTemplate(title, hideHeader)
  };
  return organizationsBase(extend(defaults, definition));
}

// Sets a feature value that will be used on the selection of the template
// that can be a new react component or the old iframe view
function setFeatureFlagInScope($scope, featureFlag) {
  onFeatureFlag($scope, featureFlag, value => {
    $scope.useNewView = value;
  });
}

// Renders a template with a condition. If given feature flag is true,
// use the react component in `reactComponentName` or else use the
// iframe template
function getTemplateFromFeatureFlag(title, hideHeader, reactComponentName) {
  return [
    h('div', { ngIf: 'useNewView === false' }, getIframeTemplate(title, hideHeader)),
    h('react-component', {
      name: reactComponentName,
      props: 'properties',
      ngIf: 'useNewView'
    })
  ];
}

function getIframeTemplate(title, hideHeader) {
  return [
    hideHeader
      ? ''
      : h('.workbench-header__wrapper', [
          h('header.workbench-header', [h('h1.workbench-header__title', [title])])
        ]),
    h('cf-account-view', { context: 'context' })
  ];
}

function reactBase(definition) {
  const defaults = {
    controller: [
      '$stateParams',
      '$scope',
      ($stateParams, $scope) => {
        $scope.properties = {
          orgId: $stateParams.orgId,
          context: $scope.context
        };
      }
    ],
    template: h(definition.componentName, { properties: 'properties' })
  };
  return organizationsBase(extend(defaults, definition));
}

function organizationsBase(definition) {
  const defaults = {
    label: 'Organizations & Billing',
    onEnter: [
      '$state',
      '$stateParams',
      'require',
      async ($state, $stateParams, require) => {
        const accessChecker = require('access_control/AccessChecker');
        const useLegacy = require('utils/ResourceUtils.es6').useLegacy;
        const TokenStore = require('services/TokenStore.es6');
        const go = require('states/Navigator.es6').go;

        const org = await TokenStore.getOrganization($stateParams.orgId);

        Analytics.trackContextChange(null, org);

        const migration = migratedStates.find(state => $state.is(state.v1));
        accessChecker.setOrganization(org);
        store.set('lastUsedOrg', $stateParams.orgId);

        const isLegacy = await useLegacy(org);

        if (isLegacy) {
          const shouldRedirectToV2 = !isLegacy && Boolean(migration);
          // redirect old v1 state to the new v2 state
          // in case a user from a previously v1 org has
          // the URL bookmarked
          if (shouldRedirectToV2) {
            go({
              path: migration.v2.split('.'),
              params: { orgId: $stateParams.orgId }
            });
          }
        }
      }
    ]
  };
  return Base(extend(defaults, definition));
}

export default Base({
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
    newUser,
    usersList,
    userDetail,
    // usersGatekeeper,
    spaces,
    offsitebackup,
    billing
  ]
});
