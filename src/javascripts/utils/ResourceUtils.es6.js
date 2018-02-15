import { getCurrentVariation } from 'utils/LaunchDarkly';

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
    return null;
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

  This should be modified once the Organization Resources endpoint
  exists to only have the feature flag deal with Version 1 orgs.
 */
export function useLegacy (organization) {
  return getCurrentVariation(flagName).then(flagValue => {
    if (flagValue === false) {
      return true;
    }

    if (isLegacyOrganization(organization)) {
      return true;
    }

    return false;
  });
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

function resourceIncludedLimitReached (resource) {
  const limitIncluded = getResourceLimits(resource).included;
  const usage = resource.usage;

  return Boolean(limitIncluded && usage >= limitIncluded);
}

function resourceMaximumLimitReached (resource) {
  const limitMaximum = getResourceLimits(resource).maximum;
  const usage = resource.usage;

  return Boolean(limitMaximum && usage >= limitMaximum);
}
