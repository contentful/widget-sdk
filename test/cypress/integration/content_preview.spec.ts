const orgId = Cypress.env('orgId');
const spaceId = Cypress.env('spaceId');
const previewName = 'Test Name';
const previewDescription = 'Test Description';
const previewId = '0xi0FU6rvrUVlJtPFuaUyl';
const apiUrl = 'https://api.flinkly.com';
const responseBody = {
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
const postRequest = {
  method: 'POST' as Cypress.HttpMethod,
  url: '**/preview_environments',
  status: 201,
  response: responseBody
};
const getRequest = {
  method: 'GET' as Cypress.HttpMethod,
  url: '**/preview_environments?limit=100',
  status: 200,
  response: {
    total: 1,
    limit: 100,
    skip: 0,
    sys: {
      type: 'Array'
    },
    items: [responseBody]
  }
};

describe('Content Preview Page', () => {
  function stubServer() {
    cy.server();
    cy.route(`${apiUrl}/token`, 'fixture:token').as('token');
    cy.route(`${apiUrl}/spaces/${spaceId}/enforcements`, 'fixture:empty').as('enforcements');
    cy.route(`${apiUrl}/spaces/${spaceId}/public/content_types?limit=1000`, 'fixture:empty').as(
      'contentTypes'
    );
    cy.route(`${apiUrl}/spaces/${spaceId}/environments?limit=101`, 'fixture:environments').as(
      'environments'
    );
    cy.route(`${apiUrl}/organizations/${orgId}/plans?plan_type=base`, 'fixture:plans').as('plans');
    cy.route(`${apiUrl}/spaces/${spaceId}/locales?limit=100&skip=0`, 'fixture:locales').as(
      'locales'
    );
    cy.route(
      `${apiUrl}/organizations/${orgId}/product_catalog_features?sys.featureId[]=teams&sys.featureId[]=custom_sidebar`,
      'fixture:product_catalog'
    ).as('productCatalog');
    cy.route(`${apiUrl}/spaces/${spaceId}/ui_config`, 'fixture:empty').as('ui_config');
    cy.route(`${apiUrl}/spaces/${spaceId}/ui_config/me`, 'fixture:ui_config').as('uiConfigMe');
    cy.route(`${apiUrl}/spaces/${spaceId}/preview_environments?limit=100`, 'fixture:empty').as(
      'preview_environments'
    );
  }

  function openPage() {
    cy.setAuthToken();
    cy.visit(`/spaces/${spaceId}/settings/content_preview/new`);
    cy.wait(['@preview_environments']);
  }

  describe('opening the page', () => {
    before(() => {
      stubServer();
      openPage();
    });

    it('renders create new content preview page', () => {
      cy.get('.content-preview-editor[data-test-id="cf-ui-form"]')
        .should('be.visible')
        .get('h3')
        .should('contain', 'Content preview URLs');
    });

    it('has a save button disabled', () => {
      cy.get('[data-test-id="save-content-preview"]').should('be.disabled');
    });
  });

  describe('saving the content preview', () => {
    before(() => {
      stubServer();
      openPage();
    });

    it('submit the form correctly', () => {
      cy.route(postRequest).as('postRequest');
      cy.route(getRequest).as('getRequest');
      cy.get('#previewName')
        .type(previewName)
        .should('have.value', previewName);
      cy.get('#previewDescription')
        .type(previewDescription)
        .should('have.value', previewDescription);
      cy.get('[data-test-id="save-content-preview"]')
        .should('be.enabled')
        .click();
      cy.get('[data-test-id="cf-ui-notification"][data-intent="success"]').should('be.visible');
      cy.url().should('include', previewId);
    });
  });
});
