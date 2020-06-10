import * as Fake from 'test/helpers/fakeFactory';
import { resourceHumanNameMap } from 'utils/ResourceUtils';

export const FULFILLMENT_STATUSES = {
  REACHED: 'reached',
  NEAR: 'near',
  OKAY: 'okay',
};

export function createResourcesForPlan(plan, status) {
  return plan.productRatePlanCharges.reduce((resources, charge) => {
    // Some product rate plan charges have no tiers, so we can't make resources from those
    if (!charge.tiers) {
      return resources;
    }

    const resourceType = Object.entries(resourceHumanNameMap).find(([, humanName]) => {
      return humanName.toLowerCase() === charge.name.toLowerCase();
    })[0];
    const limit = charge.tiers[0].endingUnit;
    let usage;

    if (status === FULFILLMENT_STATUSES.OKAY) {
      usage = 1;
    } else if (status === FULFILLMENT_STATUSES.NEAR) {
      usage = Math.ceil(limit * 0.9); // 90%
    } else if (status === FULFILLMENT_STATUSES.REACHED) {
      usage = limit;
    }

    resources.push(Fake.SpaceResource(usage, limit, resourceType));

    return resources;
  }, []);
}
