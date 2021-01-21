import React from 'react';
import DataLoader from 'dataloader';
import { memoize, get, uniq, isUndefined } from 'lodash';
import * as Config from 'Config';

import { createOrganizationEndpoint, createSpaceEndpoint } from '../EndpointFactory';

// Gatekeeper Product Catalog features
export const FEATURES = {
  ASSEMBLY_TYPES: 'assembly_types',
  ENVIRONMENT_USAGE_ENFORCEMENT: 'environment_usage_enforcements',
  ENVIRONMENT_ALIASING: 'environment_aliasing',
  CONTENT_WORKFLOW_TASKS: 'tasks',
  SCHEDULED_PUBLISHING: 'scheduled_publishing',
  PC_CONTENT_TAGS: 'content_tags',
  PC_SPACE_RELEASES: 'releases',
  PC_SPACE_REFERENCE_TREE: 'reference_tree',
  PC_SPACE_PERFORMANCE_PACKAGE: 'performance_package',
  PC_ORG_PLANNER_APP: 'planner_app',
  CUSTOM_ROLES_FEATURE: 'custom_roles',
};

// Gatekeeper Product Catalog features default values
export const DEFAULT_FEATURES_STATUS = {
  CUSTOM_ROLES_FEATURE: false,
};

// Features used commonly: we fetch them (using the same request)
// together with the first feature directly requested from the API.
// There is no prefetching! Just doing carpooling for HTTP.
// Please remember these are sent as query string parameters, so
// we may hit the URL length limit (~8k chars) some day.
const COMMON_FOR_SPACE = ['basic_apps'];
const COMMON_FOR_ORG = ['custom_sidebar', 'teams', 'self_configure_sso', 'scim', 'advanced_apps'];

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
    async (featureIds: readonly string[]) => {
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

const getLoaderForSpace = memoize((spaceId: string) => {
  return getLoaderForEndpoint(createSpaceEndpoint(spaceId, null));
});

const load = async (loader, featureId, defaultValue = false, common: any[] = []) => {
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

export const getSpaceFeature = (
  spaceId: string | undefined,
  featureId: string,
  defaultValue?: boolean
) => {
  if (!spaceId || !featureId) {
    return isUndefined(defaultValue)
      ? Promise.reject('No spaceId or featureId provided when fetching a space feature')
      : Promise.resolve(defaultValue);
  }
  return load(getLoaderForSpace(spaceId), featureId, defaultValue, COMMON_FOR_SPACE);
};

export const useSpaceFeature = (
  spaceId: string | undefined,
  featureId: string,
  defaultValue: boolean
) => {
  const [isEnabled, setIsEnabled] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!spaceId) return;

    getSpaceFeature(spaceId, featureId, defaultValue).then(setIsEnabled);
    return () => setIsEnabled(null);
  }, [defaultValue, featureId, spaceId]);

  return isEnabled;
};