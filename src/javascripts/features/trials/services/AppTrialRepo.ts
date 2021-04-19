import { memoize } from 'lodash';

import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { CollectionProp } from 'contentful-management/types';
import { AppTrialFeature } from '../types/AppTrial';

const getFeatureTrial = (featureId: string) =>
  memoize(async (orgId: string) => {
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
