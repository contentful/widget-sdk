/* eslint-disable rulesdir/allow-only-import-export-in-index, import/no-default-export */
import { AppListing } from '../management/AppListing';
import { AppDetails } from '../management/AppDetails';
import { NewApp } from '../management/NewApp';
import * as TokenStore from 'services/TokenStore';
import { isOwnerOrAdmin, isDeveloper } from 'services/OrganizationRoles';
import { getAppDefinitionLoader } from 'features/apps-core';
import { ADVANCED_APPS_FEATURE_KEY, DEFAULT_ADVANCED_APPS_STATUS } from '.';
import { getOrgFeature } from 'data/CMA/ProductCatalog';

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
            // Values have to be synced with:
            // https://github.com/contentful/extensibility-api/blob/master/lib/entities/constants.ts
            definitionLimit: hasAdvancedApps ? 50 : 10,
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
      },
      onEnter: redirectIfCannotManage,
      mapInjectedToProps: [
        '$state',
        '$stateParams',
        'definition',
        ($state, $stateParams, definition) => ({
          goToListView: () => $state.go('^.list'),
          goToTab: (tab) =>
            $state.go('^.definitions', { ...$stateParams, tab }, { location: 'replace' }),
          tab: $stateParams.tab,
          definition,
        }),
      ],
      component: AppDetails,
    },
  ],
};
