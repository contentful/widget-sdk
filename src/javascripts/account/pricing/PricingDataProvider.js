import { get, uniqueId, uniq } from 'lodash';
import { getAllSpaces, getUsersByIds } from 'access_control/OrganizationMembershipRepository';
import { getAllPlans, getAllProductRatePlans } from 'features/pricing-entities';
import { SUBSCRIPTIONS_API, getAlphaHeader } from 'alphaHeaders.js';
import isLegacyEnterprise from 'data/isLegacyEnterprise';
import { isLegacyOrganization } from 'utils/ResourceUtils';

const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

export const SELF_SERVICE = 'Self-service';
export const ENTERPRISE = 'Enterprise';
const ENTERPRISE_TRIAL = 'Enterprise Trial';
export const ENTERPRISE_HIGH_DEMAND = 'Enterprise High Demand';
export const FREE = 'Free';
export const PRO_BONO = 'Marketing - NGO';
export const PARTNER_PLATFORM_BASE_PLAN_NAME = 'Partner Platform';
export const TRIAL_SPACE_FREE_SPACE_PLAN_NAME = 'Trial Space';
export const POC_FREE_SPACE_PLAN_NAME = 'Proof of Concept';

export const ADD_ON_PLAN_TYPE = 'add_on';
export const COMPOSE_AND_LAUNCH_PLAN_NAME = 'Contentful Compose + Contentful Launch';

export const customerTypes = {
  free: [FREE],
  selfService: [SELF_SERVICE],
  enterprise: [ENTERPRISE, ENTERPRISE_TRIAL, ENTERPRISE_HIGH_DEMAND],
};

export function isSelfServicePlan(plan) {
  return customerTypes.selfService.includes(plan.customerType);
}

export function isEnterprisePlan(plan) {
  return customerTypes.enterprise.includes(plan.customerType);
}

export function isLegacyEnterpriseOrEnterprisePlan(organization, plan) {
  const isLegacyOrg = isLegacyOrganization(organization);
  return isLegacyOrg ? isLegacyEnterprise(organization) : isEnterprisePlan(plan);
}

export function isFreePlan(plan) {
  return customerTypes.free.includes(plan.customerType);
}

export function isHighDemandEnterprisePlan(plan) {
  return plan.customerType === ENTERPRISE_HIGH_DEMAND;
}

export function isPartnerPlan(plan) {
  return plan.name === PARTNER_PLATFORM_BASE_PLAN_NAME;
}

export function isProBonoPlan(plan) {
  return plan.customerType === PRO_BONO;
}

export function isFreeSpacePlan(plan) {
  // free plans do not have subscription plans
  // a plan object is created by the user interface
  // so `planType` is a hardcoded value.
  // regular paid spaces have planType of `space`
  return plan.planType === 'free_space';
}

export function isTrialSpacePlan(plan) {
  // See above about 'free_space' being hardcoded

  // TODO: replace this code with a call to the new Trials API once it is released.
  // Estimated release date March 16, 2021
  if (plan.planType === 'free_space' && plan.productName.toLowerCase().includes('trial')) {
    return true;
  }

  return false;
}

export function isFreeProductPlan(plan) {
  return plan.productPlanType === 'free_space';
}

export function isPOCSpacePlan(plan) {
  return isEnterprisePlan(plan) && isFreeSpacePlan(plan);
}

export function isComposeAndLaunchPlan(plan) {
  return plan.planType === ADD_ON_PLAN_TYPE && plan.name === COMPOSE_AND_LAUNCH_PLAN_NAME;
}

/**
 * Get all subscription plans (base and space) of the org with the associated
 * spaces for space plans, free spaces, and linked user data for each space's
 * `createdBy` field.
 * @param {object} endpoint an organization endpoint
 * @returns {object} subscription plans w. spaces & users
 */
export async function getPlansWithSpaces(endpoint) {
  const [productRatePlans, subscriptionPlans, spaces] = await Promise.all([
    getAllProductRatePlans(endpoint),
    getAllPlans(endpoint),
    getAllSpaces(endpoint),
  ]);

  const userIds = uniq(spaces.map((space) => get(space, 'sys.createdBy.sys.id')));
  const users = await getUsersByIds(endpoint, userIds);

  const linkUser = (space) => ({
    ...space,
    sys: {
      ...space.sys,
      createdBy: users.find(({ sys }) => sys.id === get(space, 'sys.createdBy.sys.id')),
    },
  });

  const freeSpaceProductPlan = productRatePlans.find(
    (productPlan) => productPlan.productPlanType === 'free_space'
  );

  const spacesWithoutSubscriptionPlan = spaces.filter(
    (space) => !subscriptionPlans.some(({ gatekeeperKey }) => space.sys.id === gatekeeperKey)
  );

  return {
    plans: subscriptionPlans,
    items: [
      ...subscriptionPlans.map((subscriptionPlan) => ({
        ...subscriptionPlan,
        ...(subscriptionPlan.gatekeeperKey && {
          space: linkUser(spaces.find(({ sys }) => sys.id === subscriptionPlan.gatekeeperKey)),
        }),
      })),
      // TODO: Handle Community, Exempt(e.g P&G) and Complimentary in GK
      ...spacesWithoutSubscriptionPlan.map((space) => ({
        sys: { id: uniqueId('free-space-plan-') },
        gatekeeperKey: space.sys.id,
        name: freeSpaceProductPlan.name,
        planType: 'free_space',
        space: linkUser(space),
      })),
    ],
  };
}

export function changeSpacePlan(endpoint, productRatePlanId) {
  return endpoint(
    {
      method: 'PUT',
      path: [],
      data: {
        productRatePlanId,
      },
    },
    alphaHeader
  );
}

/**
 * Gets the list of enabled features for the org such as offsite backup.
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} array of features in {name, internal_name}
 * format.
 */
export function getEnabledFeatures(endpoint) {
  return endpoint(
    {
      method: 'GET',
      path: ['features'],
    },
    alphaHeader
  ).then((features) => (features && features.items) || []);
}

/**
 * Receives an array of subscription plans and calculates the grand total
 * @param {object[]} subscriptionPlans
 * @returns {number}
 */
export function calculateTotalPrice(subscriptionPlans) {
  return subscriptionPlans.reduce((total, plan) => total + (parseInt(plan.price, 10) || 0), 0);
}
