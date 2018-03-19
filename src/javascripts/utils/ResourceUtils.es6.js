import { getCurrentVariation } from 'utils/LaunchDarkly';
import { assign } from 'lodash';
import $q from '$q';

const flagName = 'feature-bv-2018-01-resources-api';

const resourceHumanNameMap = {
  api_key: 'API Keys',
  asset: 'Assets',
  content_type: 'Content Types',
  entry: 'Entries',
  locale: 'Locales',
  space_membership: 'Space Memberships',
  role: 'Roles',
  space: 'Spaces',
  user: 'Users',
  webhook_definition: 'Webhook Definitions',
  asset_bandwidth: 'Asset Bandwidth',
  organization_membership: 'Organization Memberships',
  environment: 'Environments',
  record: 'Records'
};

export const canCreate = resource => !resourceMaximumLimitReached(resource);

export function generateMessage (resource) {
  const resourceId = resource.sys.id;
  const humanResourceName = resourceHumanNameMap[resourceId];

  let warning = '';
  let error = '';

  if (resourceMaximumLimitReached(resource)) {
    error = `You have exceeded your ${humanResourceName} usage.`;
  } else if (resourceIncludedLimitReached(resource)) {
    warning = `You are near the limit of your ${humanResourceName} usage.`;
  }

  return {
    warning,
    error
  };
}

export function getResourceLimits (resource) {
  if (!resource.parent && !resource.limits) {
    return {
      included: null,
      maximum: null
    };
  }

  if (resource.limits) {
    return resource.limits;
  } else if (resource.parent) {
    return getResourceLimits(resource.parent);
  }
}

/*
  If the organization pricing version is `pricing_version_2`,
  we do not use legacy.

  If the pricing version is not, we determine if we should use
  legacy based on the feature flag. If the feature flag is
  enabled, we don't use legacy, otherwise we do.
 */
export function useLegacy (organization) {
  if (isLegacyOrganization(organization)) {
    return getCurrentVariation(flagName).then(flagValue => !flagValue);
  } else {
    return $q.resolve(false);
  }
}

/*
  Determine if an organization is legacy based on the
  pricing version.

  Used in cases where the fact that the organization
  is legacy matters irrespective of the feature flag.
 */
export function isLegacyOrganization (organization) {
  const pricingVersion = organization.pricingVersion;

  if (pricingVersion === 'pricing_version_2') {
    return false;
  }

  return true;
}

/**
 * Get resource limits data from token data for organization.
 * This is used for legacy organizations instead or resource API.
 *
 * @param {Object} organization
 * @param {string} resourceType
 */
export function getLegacyLimit (resourceType, organization) {
  const allLimits = assign({},
    organization.subscriptionPlan.limits.permanent,
    organization.subscriptionPlan.limits.period
  );

  return allLimits[resourceType];
}
/**
 * Get resource usage data from token data for organization.
 * This is used for legacy organizations instead or resource API.
 *
 * @param {Object} organization
 * @param {string} resourceType
 */
export function getLegacyUsage (resourceType, organization) {
  const allUsages = assign({},
    organization.usage.permanent,
    organization.usage.period
  );

  return allUsages[resourceType];
}

export function resourceIncludedLimitReached (resource) {
  const limitIncluded = getResourceLimits(resource).included;
  const usage = resource.usage;

  return Boolean(limitIncluded && usage >= limitIncluded);
}

export function resourceMaximumLimitReached (resource) {
  const limitMaximum = getResourceLimits(resource).maximum;
  const usage = resource.usage;

  return Boolean(limitMaximum && usage >= limitMaximum);
}
