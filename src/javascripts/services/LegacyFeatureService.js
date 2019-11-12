import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/EndpointFactory';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { getSpace, getOrganization } from 'services/TokenStore';
import { getEnabledFeatures as getFeaturesFromApi } from 'account/pricing/PricingDataProvider';

import { get, snakeCase } from 'lodash';

/*
  This is the legacy feature service that allows you to query
  about features that are not yet in the product catalog, such
  as `custom_roles`.

  If the customer is on pricing version 2 (current pricing), this
  service queries the API. If the customer is on pricing version 1
  (legacy pricing), this service uses data from the token instead.
 */
export default function create(id, type = 'space') {
  const endpoint = createEndpoint(id, type);

  return { get, getAll };

  async function get(featureId) {
    const organization = await getTokenOrganization(id, type);
    const apiFeatureId = snakeCase(featureId);
    const allFeatures = await getAll(organization);
    return allFeatures.some(feature => feature.sys.id === apiFeatureId);
  }

  async function getAll() {
    const organization = await getTokenOrganization(id, type);
    const legacy = isLegacyOrganization(organization);

    if (legacy) {
      return getFeaturesFromToken(organization);
    } else {
      return getFeaturesFromApi(endpoint);
    }
  }
}

function getFeaturesFromToken(organization) {
  const featuresHash = get(organization, 'subscriptionPlan.limits.features', {});
  const enabledFeatureIds = Object.keys(featuresHash).filter(featureId => featuresHash[featureId]);

  // Make feature consistent with API Feature object
  const features = enabledFeatureIds.map(featureId => {
    return {
      sys: {
        type: 'Feature',
        id: snakeCase(featureId)
      }
    };
  });

  return features;
}

function createEndpoint(id, type) {
  const endpointFactory = type === 'space' ? createSpaceEndpoint : createOrganizationEndpoint;

  return endpointFactory(id);
}

async function getTokenOrganization(id, type) {
  if (type === 'space') {
    const space = await getSpace(id);

    return space.organization;
  } else if (type === 'organization') {
    return getOrganization(id);
  }
}
