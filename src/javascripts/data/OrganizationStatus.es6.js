// TODO: DO NOT USE THIS MODULE
// It works most of the time but the ways to obtain organization
// information are not always 100% reliable. If you need to know
// if an organization can use a feature use the Product Catalog API.
// If you need to check pricing version just use `org.prcingVersion`.

import { get } from 'lodash';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import * as PricingDataProvider from 'account/pricing/PricingDataProvider.es6';

// These don't change too often so we cache them for the whole
// user session. V2 needs to talk to the API so we prefer to
// to it this way.
const organizationStatusCache = {};

// Given a CMA organization object tells if it is:
// - an Enterprise organiation (`isEnterprise`, boolean)
// - a paid organization (`isPaid`, boolean)
// Additionally it includes `pricingVersion` property (number).
// This is async, talks to the API for v2.
// Cached for the whole user session.
export default async function isEnterprise(organization) {
  const { id } = organization.sys;
  const cached = organizationStatusCache[id];

  if (cached) {
    return cached;
  }

  let status = { isEnterprise: false, isPaid: false };

  if (organization.pricingVersion === 'pricing_version_1') {
    status = getOrganizationStatusV1(organization);
  } else if (organization.pricingVersion === 'pricing_version_2') {
    status = await getOrganizationStatusV2(organization);
  }

  organizationStatusCache[id] = status;
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

const CONVERTED_V1_SUBSCRIPTION_STATUSES = ['paid', 'free_paid'];

export function getOrganizationStatusV1(organization) {
  const subscriptionPlanName = get(organization, ['subscriptionPlan', 'name']);
  const isEnterprise = ENTERPRISE_V1_PLAN_NAMES.some(regexp => regexp.test(subscriptionPlanName));

  const subscriptionStatus = get(organization, ['subscription', 'status']);
  const isPaid = CONVERTED_V1_SUBSCRIPTION_STATUSES.includes(subscriptionStatus);

  return { pricingVersion: 1, isEnterprise, isPaid };
}

export async function getOrganizationStatusV2(organization) {
  const endpoint = createOrganizationEndpoint(organization.sys.id);

  try {
    const plan = await PricingDataProvider.getBasePlan(endpoint);
    return {
      pricingVersion: 2,
      isEnterprise: PricingDataProvider.isEnterprisePlan(plan),
      isPaid: get(plan, ['sys', 'id']) !== 'free'
    };
  } catch (err) {
    // For 404 or network issue just continue as a non-paid non-enterprise.
    return { pricingVersion: 2, isEnterprise: false, isPaid: false };
  }
}
