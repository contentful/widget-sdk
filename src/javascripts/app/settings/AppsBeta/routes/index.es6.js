import AppsListPage from '../AppsListPage.es6';
import AppPage from '../AppPage.es6';
import AppPermissions from '../AppPermissions.es6';
import { makeAppHookBus } from '../AppHookBus.es6';
import createAppExtensionBridge from 'widgets/bridges/createAppExtensionBridge.es6';
import * as Navigator from 'states/Navigator.es6';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index.es6';
import createAppsRepo from '../AppsRepo.es6';
// EXT-933 Remove all import below before finising the story
import React from 'react';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import AppDetailsModal from '../AppDetailsModal.es6';
// eslint-disable-next-line
import AppIcon from '../../apps/_common/AppIcon.es6';

export default {
  name: 'appsBeta',
  url: '/apps_beta',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: AppsListPage,
      mapInjectedToProps: [
        'spaceContext',
        '$state',
        (spaceContext, $state) => {
          return {
            goToContent: () => $state.go('^.^.entries.list'),
            repo: createAppsRepo(spaceContext.extensionDefinitionLoader, spaceContext.endpoint),
            organizationId: spaceContext.organization.sys.id,
            spaceId: spaceContext.space.data.sys.id,
            userId: spaceContext.user.sys.id
          };
        }
      ]
    },
    {
      name: 'detail',
      url: '/:appId',
      component: AppPage,
      mapInjectedToProps: [
        '$stateParams',
        'spaceContext',
        '$state',
        'entitySelector',
        ({ appId }, spaceContext, $state, entitySelector) => {
          const repo = createAppsRepo(
            spaceContext.extensionDefinitionLoader,
            spaceContext.endpoint
          );
          const appHookBus = makeAppHookBus();

          const bridge = createAppExtensionBridge({
            spaceContext,
            appHookBus,
            entitySelector,
            Navigator,
            SlideInNavigator
          });

          return {
            goBackToList: () => $state.go('^.list'),
            appId,
            repo,
            bridge,
            appHookBus,
            cma: spaceContext.cma
          };
        }
      ],

      // todo: remove before merging EXT-933
      children: [
        {
          name: 'permissions',
          url: '/permissions',
          component: AppPermissions,
          mapInjectedToProps: [
            () => {
              return {
                appId: 'optimizely',
                appName: 'Optimizely',
                intentions: [
                  'Create a webhook to send info about changes at content type level',
                  'Add a new content type for variations'
                ],
                onCancel: () => {},
                onAuthorize: () => {
                  ModalLauncher.open(({ isShown, onClose }) => (
                    <AppDetailsModal
                      isShown={isShown}
                      onClose={onClose}
                      onInstall={() => {}}
                      app={{
                        appId: 'optimizely',
                        appName: 'Optimizely',
                        author: {
                          name: 'Contentful',
                          url: 'https://contentful.com',
                          image: <AppIcon appId="contentful" size="default" />
                        },
                        links: [
                          { title: 'Help documentation', url: 'https://contentful.com' },
                          { title: 'View on Github', url: 'https://contentful.com' }
                        ],
                        categories: ['Featured'],
                        description: `
                          <p>The Optimizely app makes it easier to power experiments with structured content. It is connecting your content in Contentful with experiments in Optimizely. This enables practitioners to easily experiment with their content and run more experiments and create better insights faster.</p>
                          <h2>Overview</h2>
                          <p>Powering experiments with content from Contentful is a matter of connecting both APIs together. During rendering we can ask Optimizely to choose a variation based on targeting criteria which then allows to pick matching content from Contentful for that user.</p>
                          <p>However, this setup is fairly manual and tricky to manage as it usually requires manual copying of configuration between interfaces.</p>
                        `
                      }}
                    />
                  ));
                }
              };
            }
          ]
        }
      ]
    }
  ]
};
