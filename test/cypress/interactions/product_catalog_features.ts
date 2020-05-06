import { defaultHeader, defaultOrgId, defaultSpaceId } from '../util/requests';
import { RequestOptions, Query } from '@pact-foundation/pact';

const productCatalogOrg = require('../fixtures/responses/product-catalog-org.json');
const productCatalogSpace = require('../fixtures/responses/product-catalog-space.json');
const productCatalogTasks = require('../fixtures/responses/product-catalog-tasks.json');
const productCatalogScheduledPublishing = require('../fixtures/responses/product-catalog-scheduled-publishing.json');
const productCatalogBasicApps = require('../fixtures/responses/product-catalog-basic-apps.json');
const productCatalogContentTags = require('../fixtures/responses/product-catalog-content-tags.json');
const productCatalogCustomSidebar = require('../fixtures/responses/product-catalog-custom-sidebar.json');
const productCatalogTeams = require('../fixtures/responses/product-catalog-teams.json');
const productCatalogSelfConfigureSso = require('../fixtures/responses/product-catalog-self-configure-sso.json');
const productCatalogScim = require('../fixtures/responses/product-catalog-scim.json');

enum States {
  ORG_WITH_SEVERAL_FEATURES = 'product_catalog_features/org-with-several',
  SPACE_WITH_SEVERAL_FEATURES = 'product_catalog_features/space-with-several',
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
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: productCatalogOrg,
      },
    }).as('getAllProductCatalogFeaturesForDefaultOrg');

    return '@getAllProductCatalogFeaturesForDefaultOrg';
  },
};

function productCatalogFeaturesForDefaultSpaceRequest(query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/product_catalog_features`,
    headers: defaultHeader,
    query,
  };
}
function productCatalogFeaturesForDefaultOrgRequest(query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/organizations/${defaultOrgId}/product_catalog_features`,
    headers: defaultHeader,
    query,
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
        body: productCatalogSpace,
      },
    }).as('getAllCatalogFeaturesForDefaultSpace');

    return '@getAllCatalogFeaturesForDefaultSpace';
  },
};

export const queryForScheduledPublishingInDefaultSpace = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for "scheduled_publishing" feature for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(
        'sys.featureId[]=scheduled_publishing'
      ),
      willRespondWith: {
        status: 200,
        body: productCatalogScheduledPublishing,
      },
    }).as('queryForScheduledPublishingInDefaultSpace');

    return '@queryForScheduledPublishingInDefaultSpace';
  },
};

export const queryForScheduledPublishingOnEntryPage = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for "scheduled_publishing" on the entry page`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(
        'sys.featureId[]=scheduled_publishing'
      ),
      willRespondWith: {
        status: 200,
        body: productCatalogSpace,
      },
    }).as('queryForScheduledPublishingOnEntryPage');

    return '@queryForScheduledPublishingOnEntryPage';
  },
};

export const queryForEnvironmentAliasingInDefaultSpace = {
  willFindNone() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "environment_aliasing" feature for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(
        'sys.featureId[]=environment_aliasing'
      ),
      willRespondWith: {
        status: 404,
      },
    }).as('queryForEnvironmentAliasingInDefaultSpace');

    return '@queryForEnvironmentAliasingInDefaultSpace';
  },
};

export const queryForEnvironmentUsageInDefaultSpace = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "environment_usage_enforcements" feature for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(
        'sys.featureId[]=environment_usage_enforcements'
      ),
      willRespondWith: {
        status: 200,
      },
    }).as('queryForEnvironmentUsageInDefaultSpace');

    return '@queryForEnvironmentUsageInDefaultSpace';
  },
};

export const queryForBasicAppsInDefaultSpace = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "basic_apps" feature for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest('sys.featureId[]=basic_apps'),
      willRespondWith: {
        status: 200,
        body: productCatalogBasicApps,
      },
    }).as('queryForBasicAppsInDefaultSpace');

    return '@queryForBasicAppsInDefaultSpace';
  },
};

export const queryForTasksInDefaultSpace = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "tasks" feature for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest('sys.featureId[]=tasks'),
      willRespondWith: {
        status: 200,
        body: productCatalogTasks,
      },
    }).as('queryForTasksInDefaultSpace');

    return '@queryForTasksInDefaultSpace';
  },
};

export const queryForContentTagsInDefaultSpace = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "content tags" feature for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest('sys.featureId[]=content_tags'),
      willRespondWith: {
        status: 200,
        body: productCatalogContentTags,
      },
    }).as('queryForContentTagsInDefaultSpace');

    return '@queryForContentTagsInDefaultSpace';
  },
};

export const queryForCustomSidebarInDefaultOrg = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.ORG_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "custom sidebar" feature for org "${defaultOrgId}"`,
      withRequest: productCatalogFeaturesForDefaultOrgRequest('sys.featureId[]=custom_sidebar'),
      willRespondWith: {
        status: 200,
        body: productCatalogCustomSidebar,
      },
    }).as('queryForCustomSidebarInDefaultOrg');

    return '@queryForCustomSidebarInDefaultOrg';
  },
};

export const queryForTeamsInDefaultOrg = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.ORG_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "teams" feature for org "${defaultOrgId}"`,
      withRequest: productCatalogFeaturesForDefaultOrgRequest('sys.featureId[]=teams'),
      willRespondWith: {
        status: 200,
        body: productCatalogTeams,
      },
    }).as('queryForTeamsInDefaultOrg');

    return '@queryForTeamsInDefaultOrg';
  },
};

export const queryForSelfConfigureSsoInDefaultOrg = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.ORG_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "self_configure_sso" feature for org "${defaultOrgId}"`,
      withRequest: productCatalogFeaturesForDefaultOrgRequest('sys.featureId[]=self_configure_sso'),
      willRespondWith: {
        status: 200,
        body: productCatalogSelfConfigureSso,
      },
    }).as('queryForSelfConfigureSsoInDefaultOrg');

    return '@queryForSelfConfigureSsoInDefaultOrg';
  },
};

export const queryForScimInDefaultOrg = {
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.ORG_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for the "scim" feature for org "${defaultOrgId}"`,
      withRequest: productCatalogFeaturesForDefaultOrgRequest('sys.featureId[]=scim'),
      willRespondWith: {
        status: 200,
        body: productCatalogScim,
      },
    }).as('queryForScimInDefaultOrg');

    return '@queryForScimInDefaultOrg';
  },
};
