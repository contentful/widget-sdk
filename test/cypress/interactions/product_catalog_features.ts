import { defaultHeader, defaultOrgId, defaultSpaceId } from '../util/requests';
import { RequestOptions, Query } from '@pact-foundation/pact-web';
import { makeLink } from '@contentful/types';
import { ResponseOptions } from '@pact-foundation/pact';

const productCatalogOrg = require('../fixtures/responses/product-catalog-org.json');
const productCatalogSpace = require('../fixtures/responses/product-catalog-space.json');

enum States {
  ORG_WITH_SEVERAL_FEATURES = 'product_catalog_features/org-with-several',
  SPACE_WITH_SEVERAL_FEATURES = 'product_catalog_features/space-with-several',
}

export const PROVIDER = 'product_catalog_features';

function productCatalogFeaturesForDefaultOrgRequest(query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/organizations/${defaultOrgId}/product_catalog_features`,
    headers: defaultHeader,
    query,
  };
}

function productCatalogResponse({ items }: { items: unknown[] }): ResponseOptions {
  return {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.contentful.management.v1+json',
    },
    body: {
      total: items.length,
      sys: { type: 'Array' },
      items,
    },
  };
}

function productCatalogFeaturesForDefaultSpaceRequest(query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/product_catalog_features`,
    headers: defaultHeader,
    query,
  };
}

const createDefaultOrgFeatureVariants = ({ featureId }) => ({
  willFindFeatureDisabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for "${featureId}" feature for org "${defaultOrgId}"`,
      withRequest: productCatalogFeaturesForDefaultOrgRequest(`sys.featureId[]=${featureId}`),
      willRespondWith: productCatalogResponse({
        items: [
          {
            sys: {
              type: 'Feature',
              id: `${defaultOrgId}-${featureId}`,
              feature_id: featureId,
              space: makeLink('Organization', defaultOrgId),
            },
            enabled: false,
          },
        ],
      }),
    }).as(`queryProductCatalogInDefaultOrg.${featureId}.disabled`);

    return `@queryProductCatalogInDefaultOrg.${featureId}.disabled`;
  },
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for "${featureId}" feature for org "${defaultOrgId}"`,
      withRequest: productCatalogFeaturesForDefaultOrgRequest(`sys.featureId[]=${featureId}`),
      willRespondWith: productCatalogResponse({
        items: [
          {
            sys: {
              type: 'Feature',
              id: `${defaultOrgId}-${featureId}`,
              feature_id: featureId,
              space: makeLink('Organization', defaultOrgId),
            },
            enabled: true,
          },
        ],
      }),
    }).as(`queryProductCatalogInDefaultSpace.${featureId}.enabled`);

    return `@queryProductCatalogInDefaultSpace.${featureId}.enabled`;
  },
});

const createDefaultSpaceFeatureVariants = ({ featureId }) => ({
  willFindFeatureDisabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for disabled "${featureId}" feature for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(`sys.featureId[]=${featureId}`),
      willRespondWith: productCatalogResponse({
        items: [
          {
            sys: {
              type: 'Feature',
              id: `${defaultSpaceId}-${featureId}`,
              feature_id: featureId,
              space: makeLink('Space', defaultSpaceId),
            },
            enabled: false,
          },
        ],
      }),
    }).as(`queryProductCatalogInDefaultSpace.${featureId}.disabled`);

    return `@queryProductCatalogInDefaultSpace.${featureId}.disabled`;
  },
  willFindFeatureEnabled() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a query for enabled "${featureId}" feature for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(`sys.featureId[]=${featureId}`),
      willRespondWith: productCatalogResponse({
        items: [
          {
            sys: {
              type: 'Feature',
              id: `${defaultSpaceId}-${featureId}`,
              feature_id: featureId,
              space: makeLink('Space', defaultSpaceId),
            },
            enabled: true,
          },
        ],
      }),
    }).as(`queryProductCatalogInDefaultSpace.${featureId}.enabled`);

    return `@queryProductCatalogInDefaultSpace.${featureId}.enabled`;
  },
});

/** BEGIN providers */

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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: productCatalogOrg,
      },
    }).as('getAllProductCatalogFeaturesForDefaultOrg');

    return '@getAllProductCatalogFeaturesForDefaultOrg';
  },
};

export const getAllCatalogFeaturesForDefaultSpace = {
  willFindSeveral() {
    cy.addInteraction({
      provider: PROVIDER,
      state: States.SPACE_WITH_SEVERAL_FEATURES,
      uponReceiving: `a request to get all features for space "${defaultSpaceId}"`,
      withRequest: productCatalogFeaturesForDefaultSpaceRequest(),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: productCatalogSpace,
      },
    }).as('getAllCatalogFeaturesForDefaultSpace');

    return '@getAllCatalogFeaturesForDefaultSpace';
  },
};

/** BEGIN Organization Features */

export const queryForAdvancedAppsInDefaultOrg = createDefaultOrgFeatureVariants({
  featureId: 'advanced_apps',
});
export const queryForCustomSidebarInDefaultOrg = createDefaultOrgFeatureVariants({
  featureId: 'custom_sidebar',
});
export const queryForTeamsInDefaultOrg = createDefaultOrgFeatureVariants({ featureId: 'teams' });
export const queryForSelfConfigureSsoInDefaultOrg = createDefaultOrgFeatureVariants({
  featureId: 'self_configure_sso',
});
export const queryForScimInDefaultOrg = createDefaultOrgFeatureVariants({ featureId: 'scim' });
export const getComposeAppFeatureInDefaultOrg = createDefaultOrgFeatureVariants({
  featureId: 'compose_app',
});
export const getLaunchAppFeatureInDefaultOrg = createDefaultOrgFeatureVariants({
  featureId: 'launch_app',
});

/** BEGIN Space Features */

export const queryForBasicAppsInDefaultSpace = createDefaultSpaceFeatureVariants({
  featureId: 'basic_apps',
});
export const queryForContentTagsInDefaultSpace = createDefaultSpaceFeatureVariants({
  featureId: 'content_tags',
});
export const queryForEnvironmentAliasingInDefaultSpace = createDefaultSpaceFeatureVariants({
  featureId: 'environment_aliasing',
});
export const queryForEnvironmentUsageInDefaultSpace = createDefaultSpaceFeatureVariants({
  featureId: 'environment_usage_enforcements',
});
export const queryForScheduledPublishingInDefaultSpace = createDefaultSpaceFeatureVariants({
  featureId: 'scheduled_publishing',
});
export const queryForTasksInDefaultSpace = createDefaultSpaceFeatureVariants({
  featureId: 'tasks',
});
export const queryForReferencesTreeInDefaultSpace = createDefaultSpaceFeatureVariants({
  featureId: 'reference_tree',
});
