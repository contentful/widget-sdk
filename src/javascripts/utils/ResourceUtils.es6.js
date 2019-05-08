import { assign, get } from 'lodash';

export const resourceHumanNameMap = {
  api_key: 'API Keys',
  asset: 'Assets',
  content_type: 'Content Types',
  entry: 'Entries',
  locale: 'Locales',
  space_membership: 'Users',
  role: 'Roles',
  space: 'Spaces',
  user: 'Users',
  webhook_definition: 'Webhooks',
  asset_bandwidth: 'Asset Bandwidth',
  organization_membership: 'Users',
  environment: 'Environments',
  record: 'Records',
  api_request: 'API Requests',
  free_space: 'Free Spaces',
  pending_invitation: 'Pending invitations'
};

export const canCreate = resource => !resourceMaximumLimitReached(resource);

/**
 * Returns the whole resource metadata object from the Redux store, given the resources in the store.
 * @param  {object} resources    Resources in the Redux store
 * @param  {string} spaceId      Space id
 * @param  {string} resourceName
 * @return {Object|null}              Resource metadata object or null
 */
export function getStoreResource(resources, spaceId, resourceName) {
  return get(resources, `${spaceId}.${resourceName}`, null);
}

export function getStoreResources(resources, spaceId) {
  return get(resources, spaceId, null);
}

export function generateMessage(resource) {
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

export function getResourceLimits(resource) {
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
  Determine if an organization is legacy based on the
  pricing version.

  Used in cases where the fact that the organization
  is legacy matters.
 */
export function isLegacyOrganization(organization) {
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
export function getLegacyLimit(resourceType, organization) {
  const allLimits = assign(
    {},
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
export function getLegacyUsage(resourceType, organization) {
  const allUsages = assign({}, organization.usage.permanent, organization.usage.period);

  return allUsages[resourceType];
}

export function resourceIncludedLimitReached(resource) {
  const limitIncluded = getResourceLimits(resource).included;
  const usage = resource.usage;

  return Boolean(limitIncluded && usage >= limitIncluded);
}

export function resourceMaximumLimitReached(resource) {
  const limitMaximum = getResourceLimits(resource).maximum;
  const usage = resource.usage;

  return Boolean(limitMaximum && usage >= limitMaximum);
}

function convertToPascalCase(value) {
  return value
    .match(/[a-z]+/gi)
    .map(function(word) {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    })
    .join('');
}

export function canCreateResources(resources) {
  const allowedToCreate = {};
  resources.forEach(resource => {
    allowedToCreate[convertToPascalCase(resource.name)] = !resourceMaximumLimitReached(resource);
  });

  // record is the true source for usage on Entry and Asset
  allowedToCreate['Entry'] = allowedToCreate['Record'];
  allowedToCreate['Asset'] = allowedToCreate['Record'];

  return allowedToCreate;
}
