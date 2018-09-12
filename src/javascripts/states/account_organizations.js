'use strict';

angular
  .module('contentful')
  /**
   * @ngdoc service
   * @name states/account
   */
  .factory('states/account/organizations', [
    'require',
    require => {
      var base = require('states/Base.es6').default;
      var h = require('utils/legacy-html-hyperscript').h;
      var getStore = require('TheStore').getStore;
      var store = getStore();
      var Analytics = require('analytics/Analytics.es6');

      // A list of states that have been changed
      // to be adapted to the new pricing model (V2).
      // Orgs that are still in the old pricing model
      // still access the V1 state
      var migratedStates = [
        {
          v1: 'account.organizations.subscription',
          v2: 'account.organizations.subscription_new'
        }
      ];

      var newOrg = base({
        name: 'new',
        url: '/new',
        label: 'Create new organization',
        views: {
          // Override organization navbar from the parent state
          'nav-bar@': { template: '' }
        },
        template: [
          h('.workbench-header__wrapper', [
            h('header.workbench-header', [
              h('h1.workbench-header__title', ['Create new organization'])
            ])
          ]),
          h('cf-account-view', { context: 'context' })
        ].join('')
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
        url: '/:orgId/organization_memberships/{pathSuffix:PathSuffix}'
      });

      var usersList = base({
        name: 'users',
        title: 'Organization users',
        url: '/:orgId/organization_memberships',
        controller: [
          '$stateParams',
          '$scope',
          ($stateParams, $scope) => {
            const LD = require('utils/LaunchDarkly');
            LD.onFeatureFlag($scope, 'feature-bv-09-2018-new-org-membership-pages', function(
              value
            ) {
              $scope.useNewView = value;
            });
            $scope.properties = {
              orgId: $stateParams.orgId,
              context: $scope.context
            };
          }
        ],
        template: [
          h(
            'div',
            {
              ngIf: 'useNewView === false'
            },
            [
              workbenchHeader({ title: ['Organization users'] }),
              h('cf-account-view', { context: 'context' })
            ]
          ),
          h('react-component', {
            name: 'app/OrganizationSettings/Users/UsersList/UsersList.es6',
            props: 'properties',
            ngIf: 'useNewView'
          })
        ]
      });

      var newUser = base({
        label: 'Organizations & Billing',
        name: 'newMembership',
        title: 'Organization users',
        url: '/:orgId/organization_memberships/new',
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

      function gatekeeperBase(definition) {
        var defaults = {
          params: {
            pathSuffix: ''
          },
          template: [
            definition.hideHeader
              ? ''
              : h('.workbench-header__wrapper', [
                  h('header.workbench-header', [
                    h('h1.workbench-header__title', [definition.title])
                  ])
                ]),
            h('cf-account-view', {
              context: 'context',
              hideHeader: definition.hideHeader ? 'true' : 'false'
            })
          ].join('')
        };
        return organizationsBase(_.extend(defaults, definition));
      }

      function reactBase(definition) {
        var defaults = {
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
        return organizationsBase(_.extend(defaults, definition));
      }

      function organizationsBase(definition) {
        var defaults = {
          label: 'Organizations & Billing',
          onEnter: [
            '$state',
            '$stateParams',
            'require',
            async ($state, $stateParams, require) => {
              var accessChecker = require('access_control/AccessChecker');
              var useLegacy = require('utils/ResourceUtils.es6').useLegacy;
              var TokenStore = require('services/TokenStore.es6');
              var go = require('states/Navigator.es6').go;

              const org = await TokenStore.getOrganization($stateParams.orgId);

              Analytics.trackContextChange(null, org);

              var migration = migratedStates.find(state => $state.is(state.v1));
              accessChecker.setOrganization(org);
              store.set('lastUsedOrg', $stateParams.orgId);

              const isLegacy = await useLegacy(org);

              if (isLegacy) {
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
              }
            }
          ]
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
          usersList,
          usersGatekeeper,
          newUser,
          spaces,
          offsitebackup,
          billing
        ]
      });
    }
  ]);
