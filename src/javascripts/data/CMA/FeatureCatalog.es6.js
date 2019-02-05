import { createOrganizationEndpoint, createSpaceEndpoint } from '../EndpointFactory.es6';

const url = 'product_catalog_features';

export const getOrgFeature = (orgId, featureKey) =>
  createOrganizationEndpoint(orgId)({
    method: 'GET',
    path: `/${url}/${featureKey}`
  });

export const getOrgFeatures = (orgId, featureKeys) =>
  createOrganizationEndpoint(orgId)({
    method: 'GET',
    path: `/${url}?${featureKeys.map(key => `sys.featureId[]=${key}`).join('&')}`
  });

export const getExternalSpaceFeature = (spaceId, featureKey) =>
  createSpaceEndpoint(spaceId)({
    method: 'GET',
    path: `/${url}/${featureKey}`
  });
