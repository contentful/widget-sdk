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
      number = number + 1;
    }

    return { type, number };
  });
}

function transformSpaceRatePlan({ plan, freeSpaceResource }) {
  const isFree = plan.productPlanType === 'free_space';
  const includedResources = getIncludedResources(plan.productRatePlanCharges);
  let disabled = false;

  if (plan.unavailabilityReasons && plan.unavailabilityReasons.length > 0) {
    disabled = true;
  } else if (isFree) {
    disabled = !canCreate(freeSpaceResource);
  }

  return { ...plan, isFree, includedResources, disabled };
}

export function transformSpaceRatePlans({ spaceRatePlans = [], freeSpaceResource }) {
  return spaceRatePlans.map((plan) => transformSpaceRatePlan({ plan, freeSpaceResource }));
}
