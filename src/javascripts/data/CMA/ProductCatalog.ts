import React from 'react';
import DataLoader from 'dataloader';
import { get, isUndefined, memoize, uniq } from 'lodash';
import * as Config from 'Config';
import { clearTrialsCache } from 'features/trials';

import { createOrganizationEndpoint, createSpaceEndpoint } from '../EndpointFactory';
import { Endpoint } from 'data/CMA/types';

export enum SpaceFeatures {
  BASIC_APPS = 'basic_apps',
  CONTENT_WORKFLOW_TASKS = 'tasks',
  CUSTOM_ROLES_FEATURE = 'custom_roles',
  ENVIRONMENT_ALIASING = 'environment_aliasing',
  ENVIRONMENT_USAGE_ENFORCEMENT = 'environment_usage_enforcements',
  PC_CONTENT_TAGS = 'content_tags',
  PC_SPACE_REFERENCE_TREE = 'reference_tree',
  SCHEDULED_PUBLISHING = 'scheduled_publishing',
}

export enum OrganizationFeatures {
  ADVANCED_APPS = 'advanced_apps',
  CUSTOM_SIDEBAR = 'custom_sidebar',
  PC_ORG_COMPOSE_APP = 'compose_app',
  PC_ORG_LAUNCH_APP = 'launch_app',
  SCIM = 'scim',
  SELF_CONFIGURE_SSO = 'self_configure_sso',
  TEAMS = 'teams',
}

// Gatekeeper Product Catalog features default values
export const DEFAULT_FEATURES_STATUS = {
  CUSTOM_ROLES_FEATURE: false,
};

// Features used commonly: we fetch them (using the same request)
// together with the first feature directly requested from the API.
// There is no prefetching! Just doing carpooling for HTTP.
// Please remember these are sent as query string parameters, so
// we may hit the URL length limit (~8k chars) some day.
const COMMON_FOR_SPACE: SpaceFeatures[] = [
  SpaceFeatures.BASIC_APPS,
  SpaceFeatures.PC_CONTENT_TAGS,
  SpaceFeatures.SCHEDULED_PUBLISHING,
];

const COMMON_FOR_ORG: OrganizationFeatures[] = [
  OrganizationFeatures.CUSTOM_SIDEBAR,
  OrganizationFeatures.TEAMS,
  OrganizationFeatures.SCIM,
  OrganizationFeatures.ADVANCED_APPS,
  OrganizationFeatures.PC_ORG_LAUNCH_APP,
  OrganizationFeatures.PC_ORG_COMPOSE_APP,
  OrganizationFeatures.SELF_CONFIGURE_SSO,
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

const getLoaderForEndpoint = <TFeatures extends string>(
  endpoint: Endpoint
): DataLoader<TFeatures, boolean> => {
  // disable batching in contract tests
  const enableBatchRequests = Config.env !== 'development';
  return new DataLoader<TFeatures, boolean>(
    async (featureIds: readonly TFeatures[]) => {
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

const load = async <TFeatures>(
  loader: DataLoader<TFeatures, boolean>,
  featureId: TFeatures,
  defaultValue = false,
  common: TFeatures[] = []
) => {
  const featureIds = uniq([featureId, ...common]);

  try {
    const [enabled] = await Promise.all(featureIds.map((id) => loader.load(id)));
    return typeof enabled === 'boolean' ? enabled : defaultValue;
  } catch (err) {
    return defaultValue;
  }
};

/**
 * Determines if an org-level feature should be considered enabled with an optional fallback
 *
 * @param orgId the orgId (or a false-y value) to check. Will default to +defaultvalue+ if not specified
 * @param featureId the feature to check for
 * @param defaultValue the value to use if the orgId is false-y or otherwise unavailable
 * @throws {TypeError} a fallback value was not provided and the featureId could not be otherwise resolved
 */
export const getOrgFeature = async (
  orgId: string | undefined,
  featureId: OrganizationFeatures,
  defaultValue?: boolean
): Promise<boolean> => {
  if (!orgId || !featureId) {
    if (isUndefined(defaultValue)) {
      throw new TypeError('No orgId or featureId provided when fetching an org feature');
    }
    return defaultValue;
  }

  return load(getLoaderForOrg(orgId), featureId, defaultValue, COMMON_FOR_ORG);
};

/**
 * Determines if an space-level feature should be considered enabled with an optional fallback
 *
 * @param spaceId the spaceId (or a false-y value) to check. Will default to +defaultvalue+ if not specified
 * @param featureId the feature to check for
 * @param defaultValue the value to use if the spaceId is false-y or otherwise unavailable
 * @throws {TypeError} a fallback value was not provided and the featureId could not be otherwise resolved
 */
export const getSpaceFeature = async (
  spaceId: string | undefined,
  featureId: SpaceFeatures,
  defaultValue?: boolean
): Promise<boolean> => {
  if (!spaceId || !featureId) {
    if (isUndefined(defaultValue)) {
      throw new TypeError('No spaceId or featureId provided when fetching an org feature');
    }
    return defaultValue;
  }

  return load(getLoaderForSpace(spaceId), featureId, defaultValue, COMMON_FOR_SPACE);
};

// All product catalog flags are evicted from the cache. Only to be used after a product catalog flag(s) on
// the backend got updated. Will result in the next call of get____Feature to return the new value of the flag.
export const clearCachedProductCatalogFlags = () => {
  getLoaderForOrg.cache.clear?.();
  getLoaderForSpace.cache.clear?.();
  clearTrialsCache();
};

type FeatureGetter<TFeatures> = (
  scopeId: string,
  featureId: TFeatures,
  defaultValue?: boolean
) => Promise<boolean>;

const createFeatureHook = <TFeatures>(getFeature: FeatureGetter<TFeatures>) => (
  scopeId: string | undefined,
  featureId: TFeatures,
  defaultValue: boolean
) => {
  const [isEnabled, setIsEnabled] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!scopeId) return;

    getFeature(scopeId, featureId, defaultValue).then(setIsEnabled);

    return () => setIsEnabled(null);
  }, [defaultValue, featureId, scopeId]);

  return isEnabled;
};

export const useSpaceFeature = createFeatureHook(getSpaceFeature);
export const useOrgFeature = createFeatureHook(getOrgFeature);
