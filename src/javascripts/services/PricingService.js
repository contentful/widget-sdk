import { getSpaceRatePlans, getSingleSpacePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from './ResourceService';
import { resourceHumanNameMap, getResourceLimits } from 'utils/ResourceUtils';
import { joinWithAnd } from 'utils/StringUtils';

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

async function getValidSpacePlans(orgId, spaceId, spaceResources) {
  const endpoint = createOrganizationEndpoint(orgId);

  const spaceRatePlans = await getSpaceRatePlans(endpoint, spaceId);

  const validSpaceRatePlans = spaceRatePlans.filter((plan) => {
    // Filter out any plans that have unavailability reasons
    if (plan.unavailabilityReasons && plan.unavailabilityReasons.length > 0) {
      return false;
    }

    // Filter out any plans for which the resource usage is >= to the limits of the plan resource
    const { productRatePlanCharges } = plan;

    const validViaUsage = Object.values(SPACE_PLAN_RESOURCE_TYPES).reduce((memo, type) => {
      if (memo === false) {
        return false;
      }

      const spaceResource = spaceResources.find((r) => r.sys.id === type);

      // If we somehow didn't get the resource on the API, then we can assume this
      if (!spaceResource) {
        return memo;
      }

      const planCharge = getRatePlanChargeFor(productRatePlanCharges, type);

      if (!planCharge) {
        return memo;
      }

      // These resources don't have tiers, so we get the first tier's ending unit to see what the
      // actual limit would be
      const planResourceLimit = planCharge.tiers[0].endingUnit;
      const spaceResourceUsage = spaceResource.usage;

      // A plan is also not valid unless its new limit is greater (not gt equal) to the current space usage
      return planResourceLimit > spaceResourceUsage;
    }, true);

    if (!validViaUsage) {
      return false;
    }

    return true;
  });

  return validSpaceRatePlans;
}

function usageAtErrorThreshold(resource) {
  return resource.usage / getResourceLimits(resource).maximum >= ERROR_THRESHOLD;
}

function usageAtWarningThreshold(resource) {
  return resource.usage / getResourceLimits(resource).maximum >= WARNING_THRESHOLD;
}

function shouldRecommendPlan(resources) {
  // We shouldn't recommend a plan if the user isn't 'near' (also hasn't reached) their limits
  return Object.values(SPACE_PLAN_RESOURCE_TYPES).reduce((shouldRecommend, type) => {
    if (shouldRecommend) {
      return true;
    }

    const resource = resources.find((r) => r.sys.id === type);

    if (!resource) {
      // Ignore if the resource is missing from the API
      return false;
    }

    return usageAtErrorThreshold(resource) || usageAtWarningThreshold(resource);
  }, false);
}

/*
  Returns the next "possible" space plan that a given space (`spaceId`) could change into.

  In this case, "possible" means that the space plan that is available via the API, as well
  as having limits that are >= various resource usages.
 */

export async function recommendedSpacePlan(orgId, spaceId) {
  const spaceResources = await createResourceService(spaceId, 'space').getAll();

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

export function recommendationReasonText(resources) {
  // TODO: This function takes resources, but as a user of this service, you don't really need to
  // "interface" with resources. For now this is ok (the only consumer of this service is the space
  // wizard, which inherently has the current space resources already when recommending) but if this
  // becomes problematic we can refactor the interface of this/these functions, or service in general.
  if (!shouldRecommendPlan(resources)) {
    return '';
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

/*
  In addition to the "possible" plans needing to be valid, they must also have greater
  plan limits for given resource types than the current space rate plan.
 */
export async function nextSpacePlanForResource(orgId, spaceId, resourceType) {
  const spaceResources = await createResourceService(spaceId, 'space').getAll();
  const validSpaceRatePlans = await getValidSpacePlans(orgId, spaceId, spaceResources);

  if (validSpaceRatePlans.length === 0) {
    return null;
  }

  const endpoint = createOrganizationEndpoint(orgId);
  const currentSpaceRatePlan = await getSingleSpacePlan(endpoint, spaceId);

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

    return limit > currentPlanLimit;
  });

  return nextSpacePlan || null;
}
