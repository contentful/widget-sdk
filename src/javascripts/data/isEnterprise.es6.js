import { get, constant } from 'lodash';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

const PRICING_VERSION_TO_CHECK_MAP = {
  pricing_version_1: isEnterpriseV1,
  pricing_version_2: isEnterpriseV2
};

// These don't change too often so we cache them for the whole
// user session. V2 needs to talk to the API so we prefer to
// to it this way.
const enterpriseStatusCache = {};

// Given CMA organization object tells if it's Enterprise organiation
// or not (promise of boolean). Handles both V1 and V2 pricing.
export default async function isEnterprise(organization) {
  const { id } = organization.sys;

  if (enterpriseStatusCache[id]) {
    return true;
  }

  const checkIfEnterprise =
    PRICING_VERSION_TO_CHECK_MAP[organization.pricingVersion] || constant(false); // Unknown pricing? it's not Enterprise for sure

  const status = await checkIfEnterprise(organization);
  enterpriseStatusCache[id] = status;
  return status;
}

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
  new RegExp(`business\\s${ENTERPRISE_V1_CONTRACT_TERMS}`, 'i')
];

export function isEnterpriseV1(organization) {
  const subscriptionPlanName = get(organization, ['subscriptionPlan', 'name']);
  return ENTERPRISE_V1_PLAN_NAMES.some(regexp => regexp.test(subscriptionPlanName));
}

export async function isEnterpriseV2(organization) {
  const endpoint = createOrganizationEndpoint(organization.sys.id);

  try {
    // Yes, it's still considered "alpha".
    // Returns list of plans. Because of the query there'll
    // be only one plan, the base plan with `customerType`
    // property.
    const [plans] = await endpoint(
      {
        method: 'GET',
        path: ['plans'],
        query: { plan_type: 'base' }
      },
      { 'x-contentful-enable-alpha-feature': 'subscriptions-api' }
    );

    return plans[0].customerType.toLowerCase() === 'enterprise';
  } catch (err) {
    // Plan endpoints are 404 for all the things but valid V2.
    // If there was a network issue just continue as a non-enterprise.
    return false;
  }
}
