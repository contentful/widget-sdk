import DataLoader from 'dataloader';
import { memoize, get } from 'lodash';

import { createOrganizationEndpoint, createSpaceEndpoint } from '../EndpointFactory.es6';

// This module exposes two methods for getting feature statuses
// from the Product Catalog API:
// 1. is a feature enabled for a space?
// 2. is a feature enabled for an organization?
//
// It uses DataLoader for loading data. Batching function is
// implemented with the multikey retrieval. Multiple calls
// in a scope of a single space or organization in a single
// tick of the event loop will result in a single HTTP call.
//
// Values are cached. Once a feature is read it's status at
// the momment of retrieval will be used up until the end of
// a user session.
//
// Each method accepts an optional `defaultValue`. It will
// be used when Product Catalog is not available or returns
// a malformed response.

const getLoaderForEndpoint = endpoint => {
  return new DataLoader(async featureIds => {
    // API quirk:
    // We're using QS array, not `sys.featureId[in]=comma,separated,ids`.
    const qs = featureIds.map(featureId => `sys.featureId[]=${featureId}`).join('&');

    const { items } = await endpoint({
      method: 'GET',
      path: `/product_catalog_features?${qs}`
    });

    // We need to make sure flags for features are returned
    // in exactly the same order as requested.
    return featureIds.map(featureId => {
      const feature = (items || []).find(item => {
        // API quirk:
        // It's `sys.feature_id`, not `sys.featureId`.
        return get(item, ['sys', 'feature_id']) === featureId;
      });

      return feature && feature.enabled;
    });
  });
};

const getLoaderForOrg = memoize(orgId => {
  return getLoaderForEndpoint(createOrganizationEndpoint(orgId));
});

const getLoaderForSpace = memoize(spaceId => {
  return getLoaderForEndpoint(createSpaceEndpoint(spaceId));
});

const load = async (loader, featureId, defaultValue = false) => {
  try {
    const enabled = await loader.load(featureId);
    return typeof enabled === 'boolean' ? enabled : defaultValue;
  } catch (err) {
    return defaultValue;
  }
};

export const getOrgFeature = (orgId, featureId, defaultValue) => {
  return load(getLoaderForOrg(orgId), featureId, defaultValue);
};

export const getSpaceFeature = (spaceId, featureId, defaultValue) => {
  return load(getLoaderForSpace(spaceId), featureId, defaultValue);
};
