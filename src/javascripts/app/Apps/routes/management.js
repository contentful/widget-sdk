import AppListing from '../management/AppListing';
import AppDetails from '../management/AppDetails';
import NewApp from '../management/NewApp';
import * as TokenStore from 'services/TokenStore';
import { isOwnerOrAdmin, isDeveloper } from 'services/OrganizationRoles';

import { getAppDefinitionLoader } from '../AppDefinitionLoaderInstance';

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

export default {
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
      },
      mapInjectedToProps: [
        'definitions',
        'canManageApps',
        (definitions, canManageApps) => ({ definitions, canManageApps }),
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
