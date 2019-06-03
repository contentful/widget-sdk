import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { defaultSpaceId } from '../../../util/requests';
import { noInstalledAppsResponse } from '../../../interactions/apps';
import { spaceProductCatalogFeaturesResponse } from '../../../interactions/product_catalog_features';

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

  function setUpFakeServersAndVisitPage() {
    cy.resetAllFakeServers();

    defaultRequestsMock();
    noInstalledAppsResponse();
    spaceProductCatalogFeaturesResponse();

    cy.visit(`/spaces/${defaultSpaceId}/apps`);

    cy.wait([`@${state.Token.VALID}`, `@${state.Apps.NONE_INSTALLED}`]);
  }

  // TODO: Does the alpha feature flag changes the communication with the server side?
  describe('Opening the Apps page with disabled Alpha feature', () => {
    before(() => {
      cy.setAuthTokenToLocalStorage();

      setUpFakeServersAndVisitPage();
    });

    it('Renders the page', () => {
      cy.getByTestId('workbench-title').should('to.have.text', 'Apps');
      // TODO: Does this assertion belongs to contract test?
      cy.getByTestId('cf-ui-note')
        .should('be.visible')
        .and('contain', 'Alpha feature');
    });

    // TODO: Does this test belongs to contract test?
    it('Enable alpha feature button is enabled', () => {
      cy.getByTestId('enable-apps').should('be.enabled');
    });

    // TODO: Does this test belongs to contract test?
    it('Installing of Apps is disabled', () => {
      cy.getByTestId('disabled-apps').should('be.visible');
    });
  });

  // TODO: What happens with the server interactions here? Are they the same as before?
  // If so, we should not do a contract test here?
  describe('Enable Alpha Apps feature', () => {
    beforeEach(() => {
      cy.setAuthTokenToLocalStorage();

      setUpFakeServersAndVisitPage();
    });

    it('Enable alpha feature button enables the feature correctly', () => {
      cy.getByTestId('enable-apps')
        .should('have.text', 'Enable alpha feature')
        .click();
      cy.getByTestId('install-app').should('be.enabled');
    });

    describe('Apps links work correctly', () => {
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

      beforeEach(() => {
        cy.getByTestId('enable-apps').click();
      });

      it('App titles are correct', () => {
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
});
