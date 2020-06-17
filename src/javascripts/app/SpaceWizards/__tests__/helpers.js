import * as Fake from 'test/helpers/fakeFactory';
import { resourceHumanNameMap } from 'utils/ResourceUtils';

export const FULFILLMENT_STATUSES = {
  REACHED: 'reached',
  NEAR: 'near',
  OKAY: 'okay',
};

/*
  Plan is one of the plan fixtures in SpaceWizards/__tests__/fixtures/plan.js

  resourceStatuses is an object that has keys that match the resourceHumanNameMap key, and
  value of a FULFILLMENT_STATUSES status:

  {
    environment: FULFILLMENT_STATUSES.REACHED,
    locale: FULFILLMENT_STATUSES.NEAR
  }
 */
export function createResourcesForPlan(plan, resourceStatuses) {
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

    const resourceStatus = resourceStatuses[resourceType];

    if (!resourceStatus || resourceStatus === FULFILLMENT_STATUSES.OKAY) {
      usage = 1;
    } else if (resourceStatus === FULFILLMENT_STATUSES.NEAR) {
      usage = Math.ceil(limit * 0.9); // 90%
    } else if (resourceStatus === FULFILLMENT_STATUSES.REACHED) {
      usage = limit;
    }

    resources.push(Fake.SpaceResource(usage, limit, resourceType));

    return resources;
  }, []);
}
