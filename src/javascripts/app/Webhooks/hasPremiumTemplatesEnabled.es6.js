import { getBasePlan, isEnterprisePlan } from 'account/pricing/PricingDataProvider.es6';

export default function hasPremiumTemplatesEnabled(spaceContext) {
  const { user, organizationContext } = spaceContext;

  // Premium templates are enabled for Contentful employees...
  if (user.confirmed && (user.email || '').endsWith('@contentful.com')) {
    return true;
  }

  // ...and all pricing V2 committed (enterprise) organizations.
  if (organizationContext.organization.pricingVersion === 'pricing_version_2') {
    return getBasePlan(organizationContext.endpoint)
      .catch(() => ({}))
      .then(isEnterprisePlan);
  }

  return false;
}
