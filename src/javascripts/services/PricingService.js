import { getSpaceProductRatePlans, getSpacePlanForSpace } from 'features/pricing-entities';
import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import createResourceService from './ResourceService';
import { resourceHumanNameMap, getResourceLimits } from 'utils/ResourceUtils';
import { joinWithAnd } from 'utils/StringUtils';

// The four resource types that we care about with respect to this service.
//
// We don't care about roles, users, etc.
export const SPACE_PLAN_RESOURCE_TYPES = {
  ENVIRONMENT: 'environment',
  CONTENT_TYPE: 'content_type',
  RECORD: 'record',
  LOCALE: 'locale',
};

// Threshold for usage limit displaying/causing an error (100% usage e.g. limit reached)
const ERROR_THRESHOLD = 1;

// Threshold for usage limit displaying a warning (90% usage, e.g. near limit)
export const WARNING_THRESHOLD = 0.9;

/**
 * Given all rate plan charges for a rate plan or product rate plan, return the plan charge given by `resourceType`
 * @param  {Array[RatePlanCharge]} ratePlanCharges The rate plan, or product rate plan, charges
 * @param  {String} resourceType    One of SPACE_PLAN_RESOURCE_TYPES
 * @return {RatePlanCharge}
 */
function getRatePlanChargeFor(ratePlanCharges, resourceType) {
  // We currently have to look at the name of the rate plan charge, as there's no "internal name"
  // for us to use. Since the name may be capitalized differently, we lowercase it here (and in the
  // find call below)
  const planTypeLower = resourceHumanNameMap[resourceType].toLowerCase();
  const planCharge = ratePlanCharges.find((prp) => {
    return prp.name.toLowerCase() === planTypeLower;
  });

  return planCharge;
}

/**
 * Determines which product rate plans for the current organization are considered valid.
 *
 * A product rate plan is considered valid if it meets the following criteria:
 * 1. It has no `unavailabilityReasons`
 * 2. The plan limits for each SPACE_PLAN_RESOURCE_TYPE are higher than the current usage
 * @param  {String} orgId
 * @param  {String} spaceId
 * @param  {Array[SpaceResource]} spaceResources
 * @return {Array[ProductRatePlan]}                Array of possible rate plans
 */
async function getValidSpacePlans(orgId, spaceId, spaceResources) {
  const endpoint = createOrganizationEndpoint(orgId);

  const spaceRatePlans = await getSpaceProductRatePlans(endpoint, spaceId);

  const validSpaceRatePlans = spaceRatePlans.filter((plan) => {
    // If a plan has any unavailability reasons, it is not valid
    if (plan.unavailabilityReasons && plan.unavailabilityReasons.length > 0) {
      return false;
    }

    const { productRatePlanCharges } = plan;

    // If a plan has any limit that's less than the current usage, it's not valid
    return Object.values(SPACE_PLAN_RESOURCE_TYPES).reduce((memo, type) => {
      // If it's already invalid, then no reason to check anything else
      if (memo === false) {
        return false;
      }

      const spaceResource = spaceResources.find((r) => r.sys.id === type);

      // If we somehow didn't get the resource on the API, ignore and continue
      if (!spaceResource) {
        return memo;
      }

      const planCharge = getRatePlanChargeFor(productRatePlanCharges, type);

      // If the plan charge couldn't be found, ignore and continue
      if (!planCharge) {
        return memo;
      }

      // Charges are fundamentally based on tiers, but for these resources, we don't need to
      // worry about it. Instead, we can simply look at the first tier's endingUnit (the end
      // value of the tier) to get what the new limit would be.
      const planResourceLimit = planCharge.tiers[0].endingUnit;
      const spaceResourceUsage = spaceResource.usage;

      // Note: This is *NOT* >= on purpose. Plans are only valid if the new limit would be greater than, not greater
      // than or equal, to the current resource usage
      return planResourceLimit > spaceResourceUsage;
    }, true);
  });

  return validSpaceRatePlans;
}

/**
 * Determines if a given space resource usage is above the error threshold
 * @param  {SpaceResource} resource
 * @return {Boolean}
 */
function usageAtErrorThreshold(resource) {
  return resource.usage / getResourceLimits(resource).maximum >= ERROR_THRESHOLD;
}

/**
 * Determines if a given space resource usage is above the warning threshold
 * @param  {SpaceResource} resource
 * @return {Boolean}
 */
function usageAtWarningThreshold(resource) {
  return resource.usage / getResourceLimits(resource).maximum >= WARNING_THRESHOLD;
}

/**
 * Given a set of resources, determines if a space plan should be recommended.
 * @param  {Array[SpaceResource]} resources
 * @return {Boolean}           If we should recommend a plan based on current resource usage
 */
function shouldRecommendPlan(resources) {
  // We should only recommend a plan if there are any resources near or reached the limit
  return !!Object.values(SPACE_PLAN_RESOURCE_TYPES).find((type) => {
    const resource = resources.find((r) => r.sys.id === type);

    if (!resource) {
      // Ignore if the resource is missing from the API
      return false;
    }

    return usageAtErrorThreshold(resource) || usageAtWarningThreshold(resource);
  });
}

/**
 * Get the current recommended space plan for the given space, based on its resource usage
 *
 * @param  {String} orgId
 * @param  {String} spaceId
 * @return {ProductRatePlan?}         Recommended product rate plan, or null
 */
export async function recommendedSpacePlan(orgId, spaceId) {
  const spaceEndpoint = createSpaceEndpoint(spaceId);
  const spaceResources = await createResourceService(spaceEndpoint).getAll();

  if (!shouldRecommendPlan(spaceResources)) {
    return null;
  }

  const validSpaceRatePlans = await getValidSpacePlans(orgId, spaceId, spaceResources);

  if (validSpaceRatePlans.length === 0) {
    return null;
  }

  // The first valid space plan is the one that should be recommended
  return validSpaceRatePlans[0];
}

/**
 * Return a text explanation why a space plan is being recommended, based on the current
 * space resource usage.
 *
 * @param  {Array[Resource]} resources All space resources
 * @return {String?}         The reason, or null
 */
export function recommendationReasonText(resources) {
  // TODO: This function takes resources, but as a user of this service, you don't really need to
  // "interface" with resources. For now this is ok (the only consumer of this service is the space
  // wizard, which inherently has the current space resources already when recommending) but if this
  // becomes problematic we can refactor the interface of this/these functions, or service in general.
  if (!shouldRecommendPlan(resources)) {
    return null;
  }

  const resourcesDetails = Object.values(SPACE_PLAN_RESOURCE_TYPES).reduce(
    (details, type) => {
      const resource = resources.find((r) => r.sys.id === type);

      if (!resource) {
        return details;
      }

      if (usageAtErrorThreshold(resource)) {
        details.reached.push(resourceHumanNameMap[type]);
      } else if (usageAtWarningThreshold(resource)) {
        details.near.push(resourceHumanNameMap[type]);
      }

      return details;
    },
    { near: [], reached: [] }
  );

  const numTotalDetails = resourcesDetails.reached.length + resourcesDetails.near.length;

  let resultText = '';

  if (resourcesDetails.reached.length > 0) {
    resultText += `you’ve reached the ${joinWithAnd(resourcesDetails.reached).toLowerCase()}`;
  }

  if (resourcesDetails.near.length > 0) {
    if (resourcesDetails.reached.length > 0) {
      resultText += ' and are ';
    } else {
      resultText += 'you’re ';
    }

    resultText += `near the ${joinWithAnd(resourcesDetails.near).toLowerCase()}`;
  }

  resultText += ` limit${numTotalDetails > 1 ? 's' : ''} for your current space plan`;

  return resultText;
}

/**
 * Return the next valid space plan that additionally has limits for the given `resourceType`
 * that are greater than the current space plan limits.
 *
 * @param  {String} orgId
 * @param  {String} spaceId
 * @param  {Enum} resourceType One of `SPACE_PLAN_RESOURCE_TYPE`
 * @return {ProductRatePlan?}   Next product rate plan, or null
 */
export async function nextSpacePlanForResource(orgId, spaceId, resourceType) {
  const spaceEndpoint = createSpaceEndpoint(spaceId);
  const spaceResources = await createResourceService(spaceEndpoint).getAll();

  const validSpaceRatePlans = await getValidSpacePlans(orgId, spaceId, spaceResources);

  if (validSpaceRatePlans.length === 0) {
    return null;
  }

  const endpoint = createOrganizationEndpoint(orgId);
  const currentSpaceRatePlan = await getSpacePlanForSpace(endpoint, spaceId);

  const currentRatePlanCharge = getRatePlanChargeFor(
    currentSpaceRatePlan.ratePlanCharges,
    resourceType
  );
  const currentPlanLimit = currentRatePlanCharge?.tiers?.[0]?.endingUnit || 0;

  // This happens here, so that we get a consistent shape for the result of this function
  // rather than potentially missing `currentPlanLimit`
  const nextSpacePlan = validSpaceRatePlans.find((plan) => {
    const planCharge = getRatePlanChargeFor(plan.productRatePlanCharges, resourceType);
    const limit = planCharge?.tiers?.[0]?.endingUnit || 0;

    // Similar to `getValidSpacePlans`, the limit must be greater than, not greater than or equal,
    // to the current plan limit.
    return limit > currentPlanLimit;
  });

  return nextSpacePlan || null;
}
