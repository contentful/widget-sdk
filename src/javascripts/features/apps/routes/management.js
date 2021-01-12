import { AppListing } from '../management/AppListing';
import { AppDetails } from '../management/AppDetails';
import { NewApp } from '../management/NewApp';
import * as TokenStore from 'services/TokenStore';
import { isOwnerOrAdmin, isDeveloper } from 'services/OrganizationRoles';
import { getAppDefinitionLoader } from 'features/apps-core';
import { ADVANCED_APPS_FEATURE_KEY, DEFAULT_ADVANCED_APPS_STATUS } from '.';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import { ADVANCED_APPS_LIMIT, BASIC_APPS_LIMIT } from '../limits';

const definitionsResolver = [
  '$stateParams',
  ({ orgId }) => {
    return getAppDefinitionLoader(orgId).getAllForCurrentOrganization();
  },
];

const canManageAppsResolver = [
  '$stateParams',
  async ({ orgId }) => {
    const organization = await TokenStore.getOrganization(orgId);

    return isOwnerOrAdmin(organization) || isDeveloper(organization);
  },
];

const redirectIfCannotManage = [
  '$state',
  '$stateParams',
  'canManageApps',
  ($state, { orgId }, canManageApps) => {
    if (!canManageApps) {
      $state.go('account.organizations.apps.list', { orgId });
    }
  },
];

export const managementRoute = {
  name: 'apps',
  url: '/apps',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      resolve: {
        definitions: definitionsResolver,
        canManageApps: canManageAppsResolver,
        hasAdvancedApps: [
          '$stateParams',
          async ({ orgId }) => {
            try {
              return await getOrgFeature(
                orgId,
                ADVANCED_APPS_FEATURE_KEY,
                DEFAULT_ADVANCED_APPS_STATUS
              );
            } catch (err) {
              return DEFAULT_ADVANCED_APPS_STATUS;
            }
          },
        ],
      },
      mapInjectedToProps: [
        'definitions',
        'canManageApps',
        'hasAdvancedApps',
        (definitions, canManageApps, hasAdvancedApps) => {
          return {
            definitions,
            canManageApps,
            definitionLimit: hasAdvancedApps ? ADVANCED_APPS_LIMIT : BASIC_APPS_LIMIT,
          };
        },
      ],
      component: AppListing,
    },
    {
      name: 'new_definition',
      url: '/new_definition',
      resolve: {
        canManageApps: canManageAppsResolver,
      },
      onEnter: redirectIfCannotManage,
      mapInjectedToProps: [
        '$state',
        '$stateParams',
        ($state, { orgId }) => {
          return {
            goToDefinition: (definitionId) => $state.go('^.definitions', { definitionId }),
            goToListView: () => $state.go('^.list'),
            orgId,
          };
        },
      ],
      component: NewApp,
    },
    {
      name: 'definitions',
      url: '/definitions/:definitionId/:tab',
      resolve: {
        definitions: definitionsResolver,
        canManageApps: canManageAppsResolver,
        definition: [
          '$stateParams',
          'definitions',
          ({ definitionId }, definitions) => {
            const def = definitions.find((d) => d.sys.id === definitionId);

            if (def) {
              return def;
            } else {
              throw new Error('Not found');
            }
          },
        ],
        events: [
          '$stateParams',
          async ({ orgId, definitionId }) => {
            try {
              const { targetUrl, topics } = await getAppDefinitionLoader(orgId).getAppEvents(
                definitionId
              );
              return { enabled: true, targetUrl, topics };
            } catch (e) {
              if (e.status === 404) {
                return { enabled: false, targetUrl: '', topics: [] };
              }

              throw e;
            }
          },
        ],
      },
      onEnter: redirectIfCannotManage,
      mapInjectedToProps: [
        '$scope',
        '$state',
        '$stateParams',
        'definition',
        'events',
        ($scope, $state, $stateParams, definition, events) => ({
          goToListView: () => $state.go('^.list'),
          goToTab: (tab) =>
            $state.go(
              '^.definitions',
              { ...$stateParams, tab },
              { location: 'replace', notify: false }
            ),
          tab: $stateParams.tab,
          definition,
          events,
          setRequestLeaveConfirmation: (requestLeaveConfirmation) => {
            $scope.context.requestLeaveConfirmation = requestLeaveConfirmation;
            $scope.$applyAsync();
          },
          setDirty: (value) => {
            $scope.context.dirty = value;
            $scope.$applyAsync();
          },
        }),
      ],
      component: AppDetails,
    },
  ],
};
