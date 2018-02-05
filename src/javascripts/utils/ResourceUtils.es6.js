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
