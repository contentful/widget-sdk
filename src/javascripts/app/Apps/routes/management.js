import AppListing from '../management/AppListing';
import AppDetails from '../management/AppDetails';
import NewApp from '../management/NewApp';

import { getAppDefinitionLoader } from '../AppDefinitionLoaderInstance';

const definitionsResolver = [
  '$stateParams',
  ({ orgId }) => {
    return getAppDefinitionLoader(orgId).getAllForCurrentOrganization();
  }
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
        definitions: definitionsResolver
      },
      mapInjectedToProps: ['definitions', definitions => ({ definitions })],
      component: AppListing
    },
    {
      name: 'new_definition',
      url: '/new_definition',
      mapInjectedToProps: [
        '$state',
        '$stateParams',
        ($state, { orgId }) => {
          return {
            goToDefinition: definitionId => $state.go('^.definitions', { definitionId }),
            goToListView: () => $state.go('^.list'),
            definition: {
              sys: {
                organization: {
                  sys: {
                    type: 'Link',
                    linkType: 'Organization',
                    id: orgId
                  }
                }
              }
            }
          };
        }
      ],
      component: NewApp
    },
    {
      name: 'definitions',
      url: '/definitions/:definitionId',
      resolve: {
        definitions: definitionsResolver,
        definition: [
          '$stateParams',
          'definitions',
          ({ definitionId }, definitions) => {
            const def = definitions.find(d => d.sys.id === definitionId);

            if (def) {
              return def;
            } else {
              throw new Error('Not found');
            }
          }
        ]
      },
      mapInjectedToProps: [
        '$state',
        'definition',
        ($state, definition) => ({
          goToListView: () => $state.go('^.list'),
          definition
        })
      ],
      component: AppDetails
    }
  ]
};
