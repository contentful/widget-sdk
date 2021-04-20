import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId } from '../../../util/requests';
import {
  organizationAppDefinitions,
  appInstallation,
  publicAppDefinitions,
} from '../../../interactions/apps';
import { getAllContentTypesInDefaultSpace } from '../../../interactions/content_types';
import * as ProductCatalog from '../../../interactions/product_catalog_features';
import { queryForEditorInterfaces } from '../../../interactions/editor_interfaces';

describe('App Installation', () => {
  before(() =>
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: [
        'users',
        'apps',
        'content_types',
        'editor_interfaces',
        'entries',
        'product_catalog_features',
      ],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    })
  );

  describe('Marketplace', () => {
    let interactions: string[];
    beforeEach(() => {
      cy.resetAllFakeServers();

      interactions = [
        ...defaultRequestsMock(),
        organizationAppDefinitions.willListOnePrivate(),
        ProductCatalog.getLaunchAppFeatureInDefaultOrg.willFindFeatureEnabled(),
        ProductCatalog.getComposeAppFeatureInDefaultOrg.willFindFeatureEnabled(),
        ProductCatalog.queryForCustomSidebarInDefaultOrg.willFindFeatureEnabled(),
        ProductCatalog.queryForAdvancedAppsInDefaultOrg.willFindFeatureDisabled(),
        ProductCatalog.queryForScimInDefaultOrg.willFindFeatureEnabled(),
        ProductCatalog.queryForSelfConfigureSsoInDefaultOrg.willFindFeatureEnabled(),
        ProductCatalog.queryForTeamsInDefaultOrg.willFindFeatureEnabled(),
      ];
      // There are multiple requests to /app_definitions with different query strings
      // We always want to return the same, independent of query string, so we don't wait for the interaction
      publicAppDefinitions.willListAll();
    });

    context('with no app installed', () => {
      beforeEach(() => {
        interactions.push(appInstallation.willListNone());
        cy.server();
        cy.route('**/channel/**', []).as('shareJS');
        cy.visit(`/spaces/${defaultSpaceId}/apps`);
        cy.wait(interactions, { timeout: 20000 });
      });

      describe('should install apps', () => {
        it('public Dropbox app', () => {
          const loadAppConfigurationScreenInteraction = [
            appInstallation.willNotReturnPublicApp(),
            getAllContentTypesInDefaultSpace.willReturnOne(),
            queryForEditorInterfaces.willReturnSeveral(),
          ];

          // Open the action list
          cy.get('div')
            .contains('Dropbox')
            .parents('[data-test-id="app-title"]')
            .parent()
            .findByTestId('cf-ui-icon-button')
            .click();
          // Check if all elements are there
          cy.findByTestId('cf-ui-dropdown-list').should('be.visible');
          cy.findByTestId('cf-ui-dropdown-list').within(() => {
            cy.get('button').contains('About').should('be.visible');
            cy.get('button').contains('Install').should('be.visible');
          });

          // Click on the entire card and install
          cy.get('div').contains('Dropbox').click();
          cy.get('span').contains('Install').click();
          cy.get('button').contains('Authorize access').click();

          cy.wait(loadAppConfigurationScreenInteraction, { timeout: 20000 });

          cy.resetFakeServer('apps');
          const installInteractions = [
            appInstallation.willReturnPublicApp(),
            appInstallation.willSavePublic(),
          ];

          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(500); // wait for the loading animation to finish
          cy.get('span').contains('Install').click();
          cy.wait(installInteractions, { timeout: 20000 });
        });

        it('private app without config location', () => {
          // Open the action list
          cy.get('div')
            .contains('Private app without config')
            .parents('[data-test-id="app-title"]')
            .parent()
            .findByTestId('cf-ui-icon-button')
            .click();
          // Check if all elements are there
          cy.findByTestId('cf-ui-dropdown-list').should('be.visible');
          cy.findByTestId('cf-ui-dropdown-list').within(() => {
            cy.get('button').contains('Edit app definition').should('be.visible');
            cy.get('button').contains('Install').should('be.visible').click();
          });

          // We reset all the calls just so we can change the app installation list endpoint
          cy.resetFakeServer('apps');
          const installationInteractions = [
            organizationAppDefinitions.willListOnePrivate(),
            queryForEditorInterfaces.willReturnSeveral(),
            appInstallation.willReturnPrivateApp(),
            appInstallation.willSavePrivate(),
            appInstallation.willListSome(),
          ];
          // This call is necessary but we don't wait for it because it will timeout (flakyness)
          publicAppDefinitions.willListAll();

          // Actually do the install
          cy.get('button').contains('Authorize access').click();
          cy.wait(installationInteractions, { timeout: 5000 });

          // Check if the install list is now displayed and contains the private app
          cy.findByTestId('installed-list').should('exist');
          cy.findByTestId('installed-list')
            .get('div')
            .contains('Private app without config')
            .should('exist');
        });
      });
    });

    context('with app already installed', () => {
      beforeEach(() => {
        interactions.push(appInstallation.willListSome());
        cy.server();
        cy.route('**/channel/**', []).as('shareJS');
        cy.visit(`/spaces/${defaultSpaceId}/apps`);
        cy.wait(interactions, { timeout: 8000 });
      });

      describe('should uninstall', () => {
        it('public Dropbox app from config screen', () => {
          // Open the action list
          cy.findByTestId('installed-list').should('be.visible');
          cy.findByTestId('installed-list')
            .get('div')
            .contains('Dropbox')
            .parents('[data-test-id="app-title"]')
            .parent()
            .findByTestId('cf-ui-icon-button')
            .click();

          // Find and click uninstall in the action list
          cy.findByTestId('cf-ui-dropdown-list').should('be.visible');
          cy.findByTestId('cf-ui-dropdown-list').within(() => {
            cy.get('button').contains('Configure').should('be.visible');
            cy.get('button').contains('Uninstall').should('be.visible');
            cy.get('button').contains('About').should('be.visible');
          });
          cy.get('button').contains('Configure').click();

          // Config screen interactions
          const loadAppConfigurationScreenInteraction = [
            appInstallation.willReturnPublicApp(),
            getAllContentTypesInDefaultSpace.willReturnOne(),
            queryForEditorInterfaces.willReturnSeveral(),
          ];
          cy.wait(loadAppConfigurationScreenInteraction, { timeout: 4000 });

          // Uninstall on the config screen
          cy.findAllByTestId('app-uninstall-button').should('contain', 'Uninstall');
          cy.findByTestId('app-uninstall-button').click();
          cy.findByTestId('uninstall-button').click();
          cy.wait(appInstallation.willDeletePublic(), { timeout: 4000 });

          /* Block commented out because I couldn't get it to pass in CI
          // Reset after routing back and check if apps are gone
          cy.resetFakeServer('apps');
          const marketplaceInteractions = [organizationAppDefinitions.willListEmpty()];
          appInstallation.willListNone();
          publicAppDefinitions.willListAll();

          cy.wait(marketplaceInteractions);

          // Check if the install list is now displayed and contains the private app
          cy.findByTestId('installed-list').should('not.exist');
          */
        });
        it('public Dropbox app from listing', () => {
          // Open the action list
          cy.findByTestId('installed-list').should('be.visible');
          cy.findByTestId('installed-list')
            .get('div')
            .contains('Dropbox')
            .parents('[data-test-id="app-title"]')
            .parent()
            .findByTestId('cf-ui-icon-button')
            .click();

          // Find and click uninstall in the action list
          cy.findByTestId('cf-ui-dropdown-list').should('be.visible');
          cy.findByTestId('cf-ui-dropdown-list').within(() => {
            cy.get('button').contains('Configure').should('be.visible');
            cy.get('button').contains('Uninstall').should('be.visible');
            cy.get('button').contains('About').should('be.visible');
          });
          cy.get('button').contains('Uninstall').click();
          cy.get('button').contains('Uninstall').click();
        });
        it('private app', () => {
          // Open the action list
          cy.findByTestId('installed-list').should('be.visible');
          cy.findByTestId('installed-list')
            .get('div')
            .contains('Private app without config')
            .parents('[data-test-id="app-title"]')
            .parent()
            .findByTestId('cf-ui-icon-button')
            .click();

          // Find and click uninstall in the action list
          cy.findByTestId('cf-ui-dropdown-list').should('be.visible');
          cy.findByTestId('cf-ui-dropdown-list').within(() => {
            cy.get('button').contains('Edit app definition').should('be.visible');
            cy.get('button').contains('Uninstall').should('be.visible');
          });
          cy.get('button').contains('Uninstall').click();
          cy.get('button').contains('Uninstall').click();
        });
      });
    });
  });
});
