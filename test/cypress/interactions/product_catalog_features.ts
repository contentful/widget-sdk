import * as state from '../util/interactionState';
import {
  defaultHeader,
  defaultOrgId,
  defaultSpaceId
} from '../util/requests';
import { RequestOptions, Query } from '@pact-foundation/pact';

const productCatalogOrg = require('../fixtures/responses/product-catalog-org.json');
const productCatalogSpace = require('../fixtures/responses/product-catalog-space.json');

export const getAllProductCatalogFeaturesForDefaultOrg = {
  willFindSeveral() {
    return cy.addInteraction({
      provider: 'product_catalog_features',
      state: state.ProductCatalogFeatures.ORG_WITH_SEVERAL_FEATURES,
      uponReceiving: `a request to get all product catalog features for org "${defaultOrgId}"`,
      withRequest: {
        method: 'GET',
        path: `/organizations/${defaultOrgId}/product_catalog_features`,
        headers: defaultHeader
      },
      willRespondWith: {
        status: 200,
        body: productCatalogOrg
      }
    }).as(state.ProductCatalogFeatures.ORG_WITH_SEVERAL_FEATURES);
  }
}

function productCatalogFeaturesForDefaultSpaceRequest(query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/product_catalog_features`,
    headers: defaultHeader,
    query
  }
}

export const getAllCatalogFeaturesForDefaultSpace = {
  willFindSeveral() {
    return cy.addInteraction({
      provider: 'product_catalog_features',
      state: state.ProductCatalogFeatures.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a request to get all features for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(),
      willRespondWith: {
        status: 200,
        body: productCatalogSpace
      }
    }).as(state.ProductCatalogFeatures.SPACE_WITH_SEVERAL_FEATURES);
  }
}

export const queryForTwoSpecificFeaturesInDefaultSpace = {
  willFindBothOfThem() {
    return cy.addInteraction({
      provider: 'product_catalog_features',
      state: state.ProductCatalogFeatures.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "environment_usage_enforcements" and "basic_apps" features for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(
        'sys.featureId[]=environment_usage_enforcements&sys.featureId[]=basic_apps'
      ),
      willRespondWith: {
        status: 200,
        body: productCatalogSpace
      }
    }).as(state.ProductCatalogFeatures.SPACE_WITH_SEVERAL_FEATURES);
  }
}
