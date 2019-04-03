const productCatalog = require('../fixtures/product_catalog.json');
const orgId = Cypress.env('orgId');

export function productCatalogFeaturesResponse() {
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
}
