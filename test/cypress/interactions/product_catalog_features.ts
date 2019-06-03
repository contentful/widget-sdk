import * as state from '../util/interactionState';
import { getOrgProductCatalogFeatures, getSpaceProductCatalogFeatures } from '../util/requests';

const productCatalogOrg = require('../fixtures/responses/product-catalog-org.json');
const productCatalogSpace = require('../fixtures/responses/product-catalog-space.json');

export function orgProductCatalogFeaturesResponse() {
  cy.addInteraction({
    provider: 'product_catalog_features',
    state: state.OrgProductCatalogFeatures.SEVERAL,
    uponReceiving: 'a request for all org product catalog features',
    withRequest: getOrgProductCatalogFeatures(),
    willRespondWith: {
      status: 200,
      body: productCatalogOrg
    }
  }).as(state.OrgProductCatalogFeatures.SEVERAL);
}

export function spaceProductCatalogFeaturesResponse() {
  cy.addInteraction({
    provider: 'product_catalog_features',
    state: state.SpaceProductCatalogFeatures.SEVERAL,
    uponReceiving: 'a request for all space product catalog features',
    withRequest: getSpaceProductCatalogFeatures(),
    willRespondWith: {
      status: 200,
      body: productCatalogSpace
    }
  }).as(state.SpaceProductCatalogFeatures.SEVERAL);
}
