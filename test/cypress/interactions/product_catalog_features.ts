import { defaultHeader, defaultOrgId, defaultSpaceId } from '../util/requests';
import { RequestOptions, Query } from '@pact-foundation/pact';

const productCatalogOrg = require('../fixtures/responses/product-catalog-org.json');
const productCatalogSpace = require('../fixtures/responses/product-catalog-space.json');
const productCatalogTasksAndApps = require('../fixtures/responses/product-catalog-tasks-and-apps.json');

enum States {
  ORG_WITH_SEVERAL_FEATURES = 'product_catalog_features/org-with-several',
  SPACE_WITH_SEVERAL_FEATURES = 'product_catalog_features/space-with-several'
}

export const PROVIDER = 'product_catalog_features';

export const getAllProductCatalogFeaturesForDefaultOrg = {
  willFindSeveral() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.ORG_WITH_SEVERAL_FEATURES,
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
    }).as('getAllProductCatalogFeaturesForDefaultOrg');

    return '@getAllProductCatalogFeaturesForDefaultOrg';
  }
};

function productCatalogFeaturesForDefaultSpaceRequest(query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/product_catalog_features`,
    headers: defaultHeader,
    query
  };
}

export const getAllCatalogFeaturesForDefaultSpace = {
  willFindSeveral() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a request to get all features for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(),
      willRespondWith: {
        status: 200,
        body: productCatalogSpace
      }
    }).as('getAllCatalogFeaturesForDefaultSpace');

    return '@getAllCatalogFeaturesForDefaultSpace';
  }
};

export const queryForTasksAndAppsInDefaultSpace = {
  willFindBothOfThem() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "tasks" and "basic_apps" features for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(
        'sys.featureId[]=tasks&sys.featureId[]=basic_apps'
      ),
      willRespondWith: {
        status: 200,
        body: productCatalogTasksAndApps
      }
    }).as('queryForTasksAndAppsInDefaultSpace');

    return '@queryForTasksAndAppsInDefaultSpace';
  }
};

export const queryForTasksInDefaultSpace = {
  willFindTasksEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "tasks" features for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest('sys.featureId[]=tasks'),
      willRespondWith: {
        status: 200,
        body: productCatalogTasksAndApps
      }
    }).as('queryForTasksInDefaultSpace');

    return '@queryForTasksInDefaultSpace';
  }
};

export const queryForScheduledPublishingInDefaultSpace = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for "scheduled_publishing" feature for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(
        'sys.featureId[]=scheduled_publishing&sys.featureId[]=basic_apps'
      ),
      willRespondWith: {
        status: 200,
        body: productCatalogSpace
      }
    }).as('queryForScheduledPublishingInDefaultSpace');

    return '@queryForScheduledPublishingInDefaultSpace';
  }
};

export const queryForScheduledPublishingOnEntryPage = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for "scheduled_publishing" on the entry page`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(
        'sys.featureId[]=scheduled_publishing&sys.featureId[]=basic_apps&sys.featureId[]=tasks'
      ),
      willRespondWith: {
        status: 200,
        body: productCatalogSpace
      }
    }).as('queryForScheduledPublishingOnEntryPage');

    return '@queryForScheduledPublishingOnEntryPage';
  }
};

export const queryForScheduledPublishingOnEntryListPage = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for "scheduled_publishing" on the entry list page`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(
        'sys.featureId[]=scheduled_publishing'
      ),
      willRespondWith: {
        status: 200,
        body: productCatalogSpace
      }
    }).as('queryForScheduledPublishingOnEntryListPage');

    return '@queryForScheduledPublishingOnEntryListPage';
  }
};

export const queryForEnvironmentAliasingAndAppsInDefaultSpace = {
  willFindNone() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "environment_aliasing" and "basic_apps" features for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(
        'sys.featureId[]=environment_aliasing&sys.featureId[]=basic_apps'
      ),
      willRespondWith: {
        status: 404
      }
    }).as('queryForEnvironmentAliasingAndAppsInDefaultSpace');

    return '@queryForEnvironmentAliasingAndAppsInDefaultSpace';
  }
};

export const queryForEnvironmentUsageAndAppsInDefaultSpace = {
  willFindSeveral() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "environment_usage" and "basic_apps" features for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(
        'sys.featureId[]=environment_usage_enforcements&sys.featureId[]=basic_apps'
      ),
      willRespondWith: {
        status: 200
      }
    }).as('queryForEnvironmentUsageAndAppsInDefaultSpace');

    return '@queryForEnvironmentUsageAndAppsInDefaultSpace';
  }
};
