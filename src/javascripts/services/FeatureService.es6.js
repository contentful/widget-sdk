import { getCurrentVariation } from 'utils/LaunchDarkly';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/EndpointFactory';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { getSpace, getOrganization } from 'services/TokenStore';
import { getEnabledFeatures } from 'account/pricing/PricingDataProvider';

import { get, snakeCase } from 'lodash';

const flagName = 'feature-bv-2018-01-features-api';

export default function createFeatureService (id, type = 'space') {
  const endpoint = createEndpoint(id, type);

  return { get, getAll };

  async function get (featureId) {
    const organization = await getTokenOrganization(id, type);
    const apiFeatureId = snakeCase(featureId);
    const allFeatures = await getAll(organization);

    return allFeatures.filter(feature => feature.sys.id === apiFeatureId)[0];
  }

  async function getAll () {
    const organization = await getTokenOrganization(id, type);
    const legacy = await useLegacy(organization);

    if (legacy) {
      // Look at the Token
      return legacyGetAllFeatures(organization);
    } else {
      return getEnabledFeatures(endpoint);
    }
  }
}

function legacyGetAllFeatures (organization) {
  const featuresHash = get(organization, 'subscriptionPlan.limits.features', {});
  const features = Object.keys(featuresHash).map(featureId => {
    return {
      enabled: featuresHash[featureId],
      sys: {
        type: 'Feature',
        id: snakeCase(featureId)
      }
    };
  });

  return features;
}

function createEndpoint (id, type) {
  const endpointFactory = type === 'space' ? createSpaceEndpoint : createOrganizationEndpoint;

  return endpointFactory(id);
}

async function getTokenOrganization (id, type) {
  if (type === 'space') {
    const space = await getSpace(id);

    return space.organization;
  } else if (type === 'organization') {
    return getOrganization(id);
  }
}

async function useLegacy (organization) {
  if (isLegacyOrganization(organization)) {
    return getCurrentVariation(flagName).then(flagValue => !flagValue);
  } else {
    return false;
  }
}
