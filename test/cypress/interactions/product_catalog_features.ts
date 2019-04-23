import * as state from '../util/interactionState';
import { getProductCatalogFeatures } from '../util/requests';

const productCatalog = require('../fixtures/product-catalog.json');

export function productCatalogFeaturesResponse() {
  cy.addInteraction({
    state: state.ProductCatalogFeatures.SEVERAL,
    uponReceiving: 'a request for all product catalog features',
    withRequest: getProductCatalogFeatures(),
    willRespondWith: {
      status: 200,
      body: productCatalog
    }
  }).as(state.ProductCatalogFeatures.SEVERAL);
}
