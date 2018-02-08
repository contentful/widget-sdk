import { getCurrentVariation } from 'utils/LaunchDarkly';

const flagName = 'feature-bv-2018-01-resources-api';

const resourceHumanNameMap = {
  api_keys: 'API Keys',
  assets: 'Assets',
  content_types: 'Content Types',
  entries: 'Entries',
  locales: 'Locales',
  space_memberships: 'Space Memberships',
  roles: 'Roles',
  spaces: 'Spaces',
  users: 'Users',
  webhook_definitions: 'Webhook Definitions',
  asset_bandwidth: 'Asset Bandwidth',
  organization_memberships: 'Organization Memberships',
  environments: 'Environments',
  records: 'Records'
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
 */
export function useLegacy (organization) {
  if (organization.pricingVersion === 'pricing_version_2') {
    return Promise.resolve(false);
  } else {
    return getCurrentVariation(flagName).then(flagValue => {
      return !flagValue;
    });
  }
}

function resourceIncludedLimitReached (resource) {
  const limitIncluded = getResourceLimits(resource).included;
  const usage = resource.usage;

  return usage >= limitIncluded;
}

function resourceMaximumLimitReached (resource) {
  const limitMaximum = getResourceLimits(resource).maximum;
  const usage = resource.usage;

  return usage >= limitMaximum;
}
