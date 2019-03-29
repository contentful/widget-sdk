const orgId = Cypress.env('orgId');
const spaceId = Cypress.env('spaceId');
const previewName = 'Test Name';
const previewDescription = 'Test Description';
const previewId = '0xi0FU6rvrUVlJtPFuaUyl';
const previewResponseBody = {
  name: previewName,
  description: previewDescription,
  sys: {
    type: 'PreviewEnvironment',
    id: previewId,
    version: 0,
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: spaceId
      }
    },
    createdAt: '2019-03-06T10:53:58Z',
    updatedAt: '2019-03-06T10:53:58Z'
  },
  configurations: []
};
const token = require('../fixtures/token.json');
const empty = require('../fixtures/empty.json');
const environments = require('../fixtures/environments.json');
const plans = require('../fixtures/plans.json');
const locales = require('../fixtures/locales.json');
const productCatalog = require('../fixtures/product_catalog.json');
const uiConfig = require('../fixtures/ui_config.json');

describe('Content Preview Page', () => {

  function stubServer() {
    cy.addInteraction({
      state: 'getToken',
      uponReceiving: 'a request for token',
      withRequest: {
        method: 'GET',
        path: '/token',
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
      willRespondWith: {
        status: 200,
        body: token
      }
    }).as('token');
    cy.addInteraction({
      state: 'noEnforcements',
      uponReceiving: 'a request for all enforcements',
      withRequest: {
        method: 'GET',
        path: `/spaces/${spaceId}/enforcements`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('enforcements');
    cy.addInteraction({
      state: 'noPublicContentTypes',
      uponReceiving: 'a request for all public content types',
      withRequest: {
        method: 'GET',
        path: `/spaces/${spaceId}/public/content_types`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        },
        query: 'limit=1000'
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('publicContentTypes');
    cy.addInteraction({
      state: 'masterEnvironment',
      uponReceiving: 'a request for all environments',
      withRequest: {
        method: 'GET',
        path: `/spaces/${spaceId}/environments`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
      willRespondWith: {
        status: 200,
        body: environments
      }
    }).as('environments');
    cy.addInteraction({
      state: 'onePlan',
      uponReceiving: 'a request for all plans',
      withRequest: {
        method: 'GET',
        path: `/organizations/${orgId}/plans`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
      willRespondWith: {
        status: 200,
        body: plans
      }
    }).as('plans');
    cy.addInteraction({
      state: 'oneLocale',
      uponReceiving: 'a request for all locales',
      withRequest: {
        method: 'GET',
        path: `/spaces/${spaceId}/locales`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
      willRespondWith: {
        status: 200,
        body: locales
      }
    }).as('locales');
    cy.addInteraction({
      state: 'severalProductCatalogFeatures',
      uponReceiving: 'a request for all product catalog features',
      withRequest: {
        method: 'GET',
        path: `/organizations/${orgId}/product_catalog_features`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
      willRespondWith: {
        status: 200,
        body: productCatalog
      }
    }).as('productCatalogFeatures');
    cy.addInteraction({
      state: 'noUIConfig',
      uponReceiving: 'a request for userUIConfig',
      withRequest: {
        method: 'GET',
        path: `/spaces/${spaceId}/ui_config`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('uiConfig');
    cy.addInteraction({
      state: 'userUIConfig',
      uponReceiving: 'a request for profile UserUIConfig',
      withRequest: {
        method: 'GET',
        path: `/spaces/${spaceId}/ui_config/me`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
      willRespondWith: {
        status: 200,
        body: uiConfig
      }
    }).as('uiConfigMe');
    cy.addInteraction({
      state: 'noPreviewEnvironments',
      uponReceiving: 'a request for all preview environments',
      withRequest: {
        method: 'GET',
        path: `/spaces/${spaceId}/preview_environments`,
        query: {
          limit: '100'
        },
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('noPreviewEnvironments');
  }

  beforeEach(()=>{
    cy.setAuthToken();
    stubServer();
    cy.visit(`/spaces/${spaceId}/settings/content_preview/new`);
  })


  describe('opening the page', () => {
    beforeEach(() => {
      cy.wait(['@token', '@noPreviewEnvironments']);
    });

    it('renders create new content preview page', () => {
      cy.getByTestId('cf-ui-form')
        .should('be.visible')
        .get('h3')
        .should('contain', 'Content preview URLs');
    });

    it('has a save button disabled', () => {
      cy.getByTestId('save-content-preview').should('be.disabled');
    });
  });

  describe('saving the content preview', () => {
    beforeEach(() => {
      cy.addInteraction({
        state: 'canAddPreviewEnvironments',
        uponReceiving: 'add preview environment request',
        withRequest: {
          method: 'POST',
          path: `/spaces/${spaceId}/preview_environments`,
          headers: {
            Accept: 'application/json, text/plain, */*'
          }
        },
        willRespondWith: {
          status: 201,
          body: previewResponseBody
        }
      }).as('addPreviewEnvironments');
    });

    it('submit the form correctly', () => {
      cy.getByTestId('cf-ui-text-input')
        .type(previewName)
        .should('have.value', previewName);
      cy.getByTestId('cf-ui-textarea')
        .type(previewDescription)
        .should('have.value', previewDescription);
      cy.getByTestId('save-content-preview')
        .should('be.enabled')
        .click();
      cy.getByTestId('cf-ui-notification').should('contain', 'success');
      cy.url().should('include', previewId);
    });
  });
});
