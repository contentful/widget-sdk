import { defaultRequestsMock } from '../../util/factories';
import * as state from '../../util/interactionState';
import { defaultSpaceId } from '../../util/requests';
import { noInstalledAppsResponse } from '../../interactions/apps';
import { spaceProductCatalogFeaturesResponse } from '../../interactions/product_catalog_features';

const baseUrl = Cypress.config().baseUrl;

describe('Apps Page', () => {
  beforeEach(() => {
    cy.setAuthTokenToLocalStorage();
    defaultRequestsMock();
    noInstalledAppsResponse();
    spaceProductCatalogFeaturesResponse();

    cy.visit(`/spaces/${defaultSpaceId}/apps`);
    cy.wait([`@${state.Token.VALID}`, `@${state.PreviewEnvironments.NONE}`]);
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
        }
      ];

      beforeEach(() => {
        cy.getByTestId('enable-apps').click();
      });

      it('Apps links are correct', () => {
        cy.getByTestId('app-title')
          .find('a')
          .each(($btn, index) => {
            const { title, expectedUrl } = apps[index];

            cy.wrap($btn)
              .should('have.text', title)
              .should('have.attr', 'href')
              .and('eq', expectedUrl);
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
