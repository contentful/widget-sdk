import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { defaultSpaceId } from '../../../util/requests';
import { noInstalledAppsResponse } from '../../../interactions/apps';
import { spaceProductCatalogFeaturesResponse } from '../../../interactions/product_catalog_features';
import { FeatureFlag } from '../../../util/featureFlag';

const baseUrl = Cypress.config().baseUrl;

describe('Apps Page', () => {
  before(() =>
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['apps', 'product_catalog_features'],
      cors: true,
      pactfileWriteMode: 'merge'
    })
  );

  before(() => {
    cy.resetAllFakeServers();

    cy.setAuthTokenToLocalStorage();
    cy.enableFeatureFlags([FeatureFlag.DEFAULT]);

    defaultRequestsMock();
    noInstalledAppsResponse();
    spaceProductCatalogFeaturesResponse();

    cy.visit(`/spaces/${defaultSpaceId}/apps`);
    cy.wait([`@${state.Token.VALID}`]);
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
      cy.getByTestId('enable-apps')
        .should('have.text', 'Enable alpha feature')
        .click();
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
      cy.getByTestId('install-app')
        .click()
        .url()
        .should('eq', `${baseUrl}${apps[0].expectedUrl}`);
    });
  });
});
