import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId } from '../../../util/requests';
import { getAllInstalledAppsInDefaultSpace } from '../../../interactions/apps';
import { getAllCatalogFeaturesForDefaultSpace } from '../../../interactions/product_catalog_features';
import { FeatureFlag } from '../../../util/featureFlag';

const baseUrl = Cypress.config().baseUrl;

describe('Apps Page', () => {
  before(() => {
    cy.resetAllFakeServers();

    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['apps', 'product_catalog_features'],
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2
    });

    cy.setAuthTokenToLocalStorage();
    cy.enableFeatureFlags([FeatureFlag.DEFAULT]);

    const interactions = [
      ...defaultRequestsMock(),
      getAllInstalledAppsInDefaultSpace.willReturnNone(),
      getAllCatalogFeaturesForDefaultSpace.willFindSeveral()
    ];

    cy.visit(`/spaces/${defaultSpaceId}/apps`);
    
    cy.wait(interactions);
  });

  describe('Opening the Apps page with disabled Alpha feature', () => {
    it('Renders the page', () => {
      cy.getByTestId('workbench-title').should('to.have.text', 'Apps');
      cy.getByTestId('cf-ui-note')
        .should('be.visible')
        .and('contain', 'Alpha feature');
    });

    it('Enable alpha feature button is enabled', () => {
      cy.getByTestId('enable-apps').should('be.enabled');
    });

    it('Installing of Apps is disabled', () => {
      cy.getByTestId('disabled-apps').should('be.visible');
    });
  });

  describe('Enable Alpha Apps feature', () => {
    before(() => {
      cy.getByTestId('enable-apps').click();
    });

    const apps = [
      { title: 'Netlify', expectedUrl: `/spaces/${defaultSpaceId}/apps/netlify` },
      { title: 'Algolia', expectedUrl: `/spaces/${defaultSpaceId}/apps/algolia` },
      {
        title: 'AI image management',
        expectedUrl: `/spaces/${defaultSpaceId}/apps/aiImageManagement`
      },
      {
        title: 'Basic approval workflow',
        expectedUrl: `/spaces/${defaultSpaceId}/apps/basicApprovalWorkflow`
      },
      {
        title: 'Optimizely',
        expectedUrl: `/spaces/${defaultSpaceId}/apps/optimizely`
      }
    ];

    it('Apps links are correct', () => {
      cy.getByTestId('install-app').should('be.enabled');
      cy.getByTestId('app-title')
        .find('h3')
        .each(($h3, index) => {
          cy.wrap($h3).should('have.text', apps[index].title);
        });
    });

    it('Install button works correctly', () => {
      cy.server();
      cy.route('**/preview_environments**', 'fixture:responses/empty.json').as(
        'previewEnvironments'
      );
      cy.getByTestId('install-app').click();
      cy.getByTestId('workbench-title')
        .should('contain', 'App:')
        .and('contain', 'Netlify')
        .url()
        .should('eq', `${baseUrl}${apps[0].expectedUrl}`);
    });
  });
});
