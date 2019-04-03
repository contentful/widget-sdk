import { tokenRequestAlias, validTokenResponse } from '../../mocks/token';
import { noEnforcementsResponse } from '../../mocks/enforcements';
import { noPublicContentTypesResponse } from '../../mocks/content_types';
import { masterEnvironmentResponse } from '../../mocks/environments';
import { freePlanResponse } from '../../mocks/plans';
import { defaultLocaleResponse } from '../../mocks/locales';
import { productCatalogFeaturesResponse } from '../../mocks/product_catalog_features';
import { emptyUiConfigResponse, uiConfigMeResponse } from '../../mocks/ui_config';
import {
  noPreviewEnvironmentsAlias,
  noPreviewEnvironmentsResponse
} from '../../mocks/preview_environments';

const spaceId = Cypress.env('spaceId');
const empty = require('../../fixtures/empty.json');

describe('Content types list page', () => {
  before(() => {
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
      state: 'noContentTypesWithQuery',
      uponReceiving: 'a request for all content types',
      withRequest: {
        method: 'GET',
        path: `/spaces/${spaceId}/content_types`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        },
        query: 'limit=1000&order=name'
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('noContentTypes');
    cy.visit(`/spaces/${spaceId}/content_types`);
    cy.wait([`@${tokenRequestAlias}`, `@${noPreviewEnvironmentsAlias}`]);
  });
  describe('Opening the page with no content types', () => {
    it('Renders the page', () => {
      cy.getByTestId('create-content-type-empty-state')
        .should('be.visible')
        .should('be.enabled');
    });
    it('Shows no content type advice', () => {
      cy.getByTestId('no-content-type-advice').should('be.visible');
    });
    it('Add content type button redirects correctly', () => {
      cy.addInteraction({
        state: 'noExtensions',
        uponReceiving: 'a request for all extensions',
        withRequest: {
          method: 'GET',
          path: `/spaces/${spaceId}/environments/master/extensions`,
          headers: {
            Accept: 'application/json, text/plain, */*'
          }
        },
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('noExtensions');
      cy.addInteraction({
        state: 'noContentTypes',
        uponReceiving: 'a request for all content types',
        withRequest: {
          method: 'GET',
          path: `/spaces/${spaceId}/content_types`,
          headers: {
            Accept: 'application/json, text/plain, */*'
          }
        },
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('noContentTypes');
      cy.getByTestId('create-content-type-empty-state').click();
      cy.url().should('contain', '/content_types_new/fields');
    });
  });
});
