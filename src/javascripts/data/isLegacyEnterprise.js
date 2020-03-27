import { get } from 'lodash';

const PRICING_V1 = 'pricing_version_1';
const PLAN_NAME_PATH = ['subscriptionPlan', 'name'];

// We put double `\\`, so in the string-based `RegExp` constructor
// they are parsed correctly, with one `\`.
const ENTERPRISE_V1_CONTRACT_TERMS = '\\((quarterly|monthly|annual)\\)';

// These names are hardcoded and there's a chance new enterprise
// plans not covered by these rules will be introduced. The good
// information is that most likely we won't introduce more V1 plans
// and will prefer V2 plans instead.
const ENTERPRISE_V1_PLAN_NAMES = [
  new RegExp('enterprise', 'i'),
  new RegExp(`scale\\s${ENTERPRISE_V1_CONTRACT_TERMS}`, 'i'),
  new RegExp(`business\\s${ENTERPRISE_V1_CONTRACT_TERMS}`, 'i'),
];

export default function isLegacyEnterprise(organization) {
  if (organization && organization.pricingVersion === PRICING_V1) {
    const subscriptionPlanName = get(organization, PLAN_NAME_PATH);
    return ENTERPRISE_V1_PLAN_NAMES.some((regexp) => regexp.test(subscriptionPlanName));
  } else {
    return false;
  }
}
