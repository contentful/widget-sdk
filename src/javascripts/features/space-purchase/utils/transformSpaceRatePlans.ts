import { canCreate } from 'utils/ResourceUtils';

import type { ProductRatePlan, ProductRatePlanCharge } from 'features/pricing-entities';
import type { SpaceProductRatePlan, FreeSpaceResource, SetRequired } from '../types';

enum SpaceResourceKind {
  Environments = 'Environments',
  Roles = 'Roles',
  Locales = 'Locales',
  ContentTypes = 'Content types',
  Records = 'Records',
}

type TieredProductRatePlanCharge = SetRequired<ProductRatePlanCharge, 'tiers'>;

function getIncludedResources(charges: TieredProductRatePlanCharge[]) {
  return Object.values(SpaceResourceKind).map((type) => {
    const charge = charges.find(({ name }) => name === type);
    let number = charge?.tiers[0].endingUnit ?? 0;

    // Add "extra" environment and role to include `master` and `admin`
    if ([SpaceResourceKind.Environments, SpaceResourceKind.Roles].includes(type)) {
      number++;
    }

    return { type, number };
  });
}

function transformSpaceRatePlan(
  plan: ProductRatePlan,
  freeSpaceResource: FreeSpaceResource
): SpaceProductRatePlan {
  const { productRatePlanCharges, productPlanType, unavailabilityReasons } = plan;

  const includedResources = getIncludedResources(
    productRatePlanCharges as TieredProductRatePlanCharge[]
  );
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

export function transformSpaceRatePlans(
  productRatePlans: ProductRatePlan[] = [],
  freeSpaceResource: FreeSpaceResource
): SpaceProductRatePlan[] {
  return productRatePlans.map((plan) => transformSpaceRatePlan(plan, freeSpaceResource));
}
