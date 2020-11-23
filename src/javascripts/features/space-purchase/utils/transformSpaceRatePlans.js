import { canCreate } from 'utils/ResourceUtils';

const SpaceResourceTypes = {
  Environments: 'Environments',
  Roles: 'Roles',
  Locales: 'Locales',
  ContentTypes: 'Content types',
  Records: 'Records',
};

function getIncludedResources(charges) {
  return Object.values(SpaceResourceTypes).map((type) => {
    const charge = charges.find(({ name }) => name === type);
    let number = charge.tiers[0].endingUnit;

    // Add "extra" environment and role to include `master` and `admin`
    if ([SpaceResourceTypes.Environments, SpaceResourceTypes.Roles].includes(type)) {
      number++;
    }

    return { type, number };
  });
}

function transformSpaceRatePlan(plan, freeSpaceResource) {
  const { productRatePlanCharges, productPlanType, unavailabilityReasons } = plan;

  const includedResources = getIncludedResources(productRatePlanCharges);
  const isFree = productPlanType === 'free_space';
  let currentPlan = false;
  let disabled = false;

  if (unavailabilityReasons && unavailabilityReasons.length > 0) {
    currentPlan = unavailabilityReasons.some((reason) => reason.type === 'currentPlan');
    disabled = true;
  } else if (isFree) {
    disabled = !canCreate(freeSpaceResource);
  }

  return {
    ...plan,
    isFree,
    disabled,
    currentPlan,
    includedResources,
  };
}

/**
 * It returns the space rate plans with some additional information:
 * - If a plan is free, it will return with `isFree: true`;
 * - If a plan has at least 1 unavailability reason, it will return with `disabled: true`;
 * - If a plan has the 'currentPlan' unavailability reason, it will return with `currentPlan: true`;
 * - Each plan will return with includedResources, which is an array of the resources the space plan includes and their limits;
 *
 * @param {Object[]} plan the space rate plan you want to transform
 * @param {Object} freeSpaceResource
 * @returns {Object[]} an array of space rate plans with the properties mentioned above
 */
export function transformSpaceRatePlans(spaceRatePlans = [], freeSpaceResource) {
  return spaceRatePlans.map((plan) => transformSpaceRatePlan(plan, freeSpaceResource));
}
