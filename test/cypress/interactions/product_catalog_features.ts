import * as state from '../util/interactionState';
import { getOrgProductCatalogFeatures, getSpaceProductCatalogFeatures } from '../util/requests';
import { Query } from '@pact-foundation/pact';

export const defaultSpaceId = Cypress.env('spaceId');
const productCatalogOrg = require('../fixtures/responses/product-catalog-org.json');
const productCatalogSpace = require('../fixtures/responses/product-catalog-space.json');

export function orgProductCatalogFeaturesResponse() {
  cy.addInteraction({
    provider: 'product_catalog_features',
    state: state.ProductCatalogFeatures.ORG_WITH_SEVERAL_FEATURES,
    uponReceiving: 'a request for all org product catalog features',
    withRequest: getOrgProductCatalogFeatures(),
    willRespondWith: {
      status: 200,
      body: productCatalogOrg
    }
  }).as(state.ProductCatalogFeatures.ORG_WITH_SEVERAL_FEATURES);
}

export function spaceProductCatalogFeaturesResponse(query? :Query) {
  const queryDesc = query ? ` (with query "${query}")` : ''
  cy.addInteraction({
    provider: 'product_catalog_features',
    state: state.ProductCatalogFeatures.SPACE_WITH_SEVERAL_FEATURES,
    uponReceiving: `a request for all space product catalog features${queryDesc}`,
    withRequest: getSpaceProductCatalogFeatures(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: productCatalogSpace
    }
  }).as(state.ProductCatalogFeatures.SPACE_WITH_SEVERAL_FEATURES);
}
