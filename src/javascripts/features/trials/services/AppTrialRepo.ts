import { COMPOSE_LAUNCH_TRIAL, getAlphaHeader } from 'alphaHeaders';
import { OrganizationEndpoint } from 'data/CMA/types';
import { CollectionProp } from 'contentful-management/types';

const headers = getAlphaHeader(COMPOSE_LAUNCH_TRIAL);

export interface AppTrialFeature {
  name: string;
  enabled: boolean;
  sys: {
    feature_id: string;
    id: string;
    organization: {
      sys: {
        id: string;
      };
    };
    trial?: {
      startedAt: string;
      endsAt: string;
    };
  };
}

export interface AppTrial {
  spaceKey: string;
  trial: {
    startedAt: string;
    endsAt: string;
  };
}

export const createAppTrialRepo = (endpoint: OrganizationEndpoint) => {
  const getTrial = async (featureId): Promise<AppTrialFeature> => {
    const data = await endpoint<CollectionProp<AppTrialFeature>>({
      method: 'GET',
      path: '/product_catalog_features',
      query: {
        'sys.featureId[]': featureId,
      },
    });
    return data.items[0];
  };

  const createTrial = async (): Promise<AppTrial> => {
    const response: Promise<AppTrial> = endpoint<AppTrial>(
      {
        method: 'POST',
        path: '/_compose_launch_trial',
      },
      headers
    );
    return response;
  };

  return {
    getTrial,
    createTrial,
  };
};
