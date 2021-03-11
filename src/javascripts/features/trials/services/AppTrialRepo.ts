import { memoize } from 'lodash';

import { COMPOSE_LAUNCH_TRIAL, getAlphaHeader } from 'alphaHeaders';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { CollectionProp } from 'contentful-management/types';
import { AppTrial, AppTrialFeature } from '../types/AppTrial';

const headers = getAlphaHeader(COMPOSE_LAUNCH_TRIAL);

const getFeatureTrial = (featureId) =>
  memoize(async (orgId) => {
    const endpoint = createOrganizationEndpoint(orgId);
    const data = await endpoint<CollectionProp<AppTrialFeature>>({
      method: 'GET',
      path: '/product_catalog_features',
      query: {
        'sys.featureId[]': featureId,
      },
    });
    return data.items[0];
  });

export const getTrial = getFeatureTrial('compose_app');

export const createTrial = (orgId) => {
  const endpoint = createOrganizationEndpoint(orgId);
  const response = endpoint<AppTrial>(
    {
      method: 'POST',
      path: '/_compose_launch_trial',
    },
    headers
  );
  return response;
};
