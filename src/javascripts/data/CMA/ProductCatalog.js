import DataLoader from 'dataloader';
import { memoize, get, uniq, isUndefined } from 'lodash';
import { getModule } from 'core/NgRegistry';
import * as Config from 'Config';

import { createOrganizationEndpoint, createSpaceEndpoint } from '../EndpointFactory';

// Features used commonly: we fetch them (using the same request)
// together with the first feature directly requested from the API.
// There is no prefetching! Just doing carpooling for HTTP.
// Please remember these are sent as query string parameters, so
// we may hit the URL length limit (~8k chars) some day.
const COMMON_FOR_SPACE = ['basic_apps'];
const COMMON_FOR_ORG = [
  'custom_sidebar',
  'teams',
  'self_configure_sso',
  'scim',
  'unlimited_asset_file_size',
];

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

const getLoaderForEndpoint = (endpoint) => {
  // disable batching in contract tests
  const enableBatchRequests = Config.env !== 'development';
  return new DataLoader(
    async (featureIds) => {
      // API quirk:
      // We're using QS array, not `sys.featureId[in]=comma,separated,ids`.
      const qs = featureIds
        .map(
          (featureId) => `${encodeURIComponent('sys.featureId[]')}=${encodeURIComponent(featureId)}`
        )
        .join('&');

      const { items } = await endpoint({
        method: 'GET',
        path: `/product_catalog_features?${qs}`,
      });

      // We need to make sure flags for features are returned
      // in exactly the same order as requested.
      return featureIds.map((featureId) => {
        const feature = (items || []).find((item) => {
          // API quirk:
          // It's `sys.feature_id`, not `sys.featureId`.
          return get(item, ['sys', 'feature_id']) === featureId;
        });

        return feature && feature.enabled;
      });
    },
    { batch: enableBatchRequests }
  );
};

const getLoaderForOrg = memoize((orgId) => {
  return getLoaderForEndpoint(createOrganizationEndpoint(orgId));
});

const getLoaderForSpace = memoize((spaceId) => {
  return getLoaderForEndpoint(createSpaceEndpoint(spaceId));
});

const load = async (loader, featureId, defaultValue = false, common = []) => {
  const featureIds = uniq([featureId, ...common]);

  try {
    const [enabled] = await Promise.all(featureIds.map((id) => loader.load(id)));
    return typeof enabled === 'boolean' ? enabled : defaultValue;
  } catch (err) {
    return defaultValue;
  }
};

export const getOrgFeature = async (orgId, featureId, defaultValue) => {
  if (!orgId || !featureId) {
    return isUndefined(defaultValue)
      ? Promise.reject('No orgId or featureId provided when fetching an org feature')
      : Promise.resolve(defaultValue);
  }

  return load(getLoaderForOrg(orgId), featureId, defaultValue, COMMON_FOR_ORG);
};

export const getSpaceFeature = (spaceId, featureId, defaultValue) => {
  if (!spaceId || !featureId) {
    return isUndefined(defaultValue)
      ? Promise.reject('No spaceId or featureId provided when fetching a space feature')
      : Promise.resolve(defaultValue);
  }
  return load(getLoaderForSpace(spaceId), featureId, defaultValue, COMMON_FOR_SPACE);
};

export const getCurrentSpaceFeature = (featureId, defaultValue) => {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.space.getId();
  return getSpaceFeature(spaceId, featureId, defaultValue);
};
