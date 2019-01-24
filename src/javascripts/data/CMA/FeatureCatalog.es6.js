import { createOrganizationEndpoint, createSpaceEndpoint } from '../EndpointFactory.es6';

export const getOrgFeature = (orgId, featureKey) =>
  createOrganizationEndpoint(orgId)({
    method: 'GET',
    path: `/product_catalog_features/${featureKey}`
  });

export const getExternalSpaceFeature = (spaceId, featureKey) =>
  createSpaceEndpoint(spaceId)({
    method: 'GET',
    path: `/product_catalog_features/${featureKey}`
  });
