import { validTokenResponse } from '../../mocks/token';
import { noEnforcementsResponse } from '../../mocks/enforcements';
import { noPublicContentTypesResponse } from '../../mocks/content_types';
import { masterEnvironmentResponse } from '../../mocks/environments';
import { freePlanResponse } from '../../mocks/plans';
import { defaultLocaleResponse } from '../../mocks/locales';
import { productCatalogFeaturesResponse } from '../../mocks/product_catalog_features';
import { emptyUiConfigResponse, uiConfigMeResponse } from '../../mocks/ui_config';
import { noPreviewEnvironmentsResponse } from '../../mocks/preview_environments';
import * as state from '../../mocks/interactionState';

const spaceId = Cypress.env('spaceId');

describe('Apps Page', () => {
  beforeEach(() => {
    cy.setAuthTokenToLocalStorage();
    validTokenResponse();
    noEnforcementsResponse();
    noPublicContentTypesResponse();
    masterEnvironmentResponse();
    freePlanResponse();
    defaultLocaleResponse();
    productCatalogFeaturesResponse();
    emptyUiConfigResponse();
    uiConfigMeResponse();
    noPreviewEnvironmentsResponse();
    cy.addInteraction({
      state: 'noInstalledApps',
      uponReceiving: 'a request for all installed Apps',
      withRequest: {
        method: 'GET',
        path: `/_microbackends/backends/apps/spaces/${spaceId}/`,
        headers: {}
      },
      willRespondWith: {
        status: 200,
        body: {}
      }
    }).as('apps');
    cy.visit(`/spaces/${spaceId}/apps`);
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
        { title: 'Netlify', expectedUrl: `/spaces/${spaceId}/apps/netlify` },
        { title: 'Algolia', expectedUrl: `/spaces/${spaceId}/apps/algolia` },
        {
          title: 'AI image management',
          expectedUrl: `/spaces/${spaceId}/apps/aiImageManagement`
        },
        {
          title: 'Basic approval workflow',
          expectedUrl: `/spaces/${spaceId}/apps/basicApprovalWorkflow`
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
          .should('eq', `${Cypress.config().baseUrl}${apps[0].expectedUrl}`);
      });
    });
  });
});
